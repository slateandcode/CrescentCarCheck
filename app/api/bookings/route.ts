import { NextResponse } from 'next/server'
import { validateForm } from '@/lib/validation'
import { getPackageById, travelFeeForEmirate, distanceClassForEmirate } from '@/lib/packages'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe'
import {
  SlotUnavailableError,
  attachStripeSession,
  createBookingHold,
  getSlotAvailability,
  releaseHold,
  rowToRecord,
} from '@/lib/availability'
import type { BookingHoldInput } from '@/lib/availability'
import { clientIp, rateLimitOk } from '@/lib/rate-limit'
import type { BookingFormData, Emirate, ParkingType, SlotTime } from '@/types/booking'

/**
 * Booking creation (App Router Route Handler — server-only, never cached).
 *
 * Flow: validate → derive authoritative price → pre-check the chosen slot →
 * create a payment HOLD via the create_booking_hold RPC (which generates the
 * CCB-XXXXXX reference and enforces every slot rule atomically) → create a Stripe
 * Checkout Session → return its URL. The customer is redirected to Stripe; the
 * booking only becomes paid via the Stripe webhook (see
 * app/api/webhooks/stripe/route.ts). No confirmation emails are sent here.
 *
 * Money is always computed from the package catalogue + emirate, never trusted
 * from the client. The booking reference is owned by the database, not minted here.
 */

const UNAVAILABLE_MESSAGE = 'That slot was just booked. Please choose another time.'

/** Resolves the public origin for Stripe success/cancel URLs. */
function appUrl(req: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return new URL(req.url).origin
}

export async function POST(req: Request) {
  // Anti-abuse: cap booking attempts per IP. Each accepted attempt reserves one
  // of only 5 daily slots for 30 minutes and opens a live Stripe session, so an
  // unthrottled flood could squat the whole funnel. Fails open if unavailable.
  if (!(await rateLimitOk(`booking:${clientIp(req)}`, 6, 60))) {
    return NextResponse.json(
      { ok: false, error: 'Too many booking attempts. Please wait a minute and try again.' },
      { status: 429 },
    )
  }

  let body: Partial<BookingFormData>
  try {
    body = (await req.json()) as Partial<BookingFormData>
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 })
  }

  // Normalise to the full form shape so the shared validator can run.
  const form: BookingFormData = {
    customerName: body.customerName ?? '',
    customerPhone: body.customerPhone ?? '',
    customerEmail: body.customerEmail ?? '',
    emirate: body.emirate ?? '',
    address: body.address ?? '',
    locationLat: body.locationLat ?? null,
    locationLng: body.locationLng ?? null,
    parkingType: body.parkingType ?? '',
    carMake: body.carMake ?? '',
    carModel: body.carModel ?? '',
    carYear: body.carYear ?? '',
    additionalNotes: body.additionalNotes ?? '',
    inspectionDate: body.inspectionDate ?? '',
    slotTime: body.slotTime ?? '',
    packageId: body.packageId ?? 'comprehensive',
  }

  const errors = validateForm(form)
  if (Object.keys(errors).length) {
    return NextResponse.json({ ok: false, errors }, { status: 422 })
  }

  // Price/name come from the canonical catalogue — never trust client-sent money.
  const pkg = getPackageById(form.packageId)
  if (!pkg) {
    return NextResponse.json({ ok: false, error: 'Unknown package selected.' }, { status: 422 })
  }

  // The payment flow needs both Supabase (to hold the slot) and Stripe (to take
  // payment). Without them we can't honour "pay to secure the slot", so fail
  // clearly instead of pretending the booking went through.
  if (!isSupabaseConfigured() || !isStripeConfigured()) {
    console.error('[booking] payment flow not configured', {
      supabase: isSupabaseConfigured(),
      stripe: isStripeConfigured(),
    })
    return NextResponse.json(
      {
        ok: false,
        error: 'Online booking is temporarily unavailable. Please WhatsApp us to book.',
      },
      { status: 503 },
    )
  }

  const emirate = form.emirate as Emirate
  const slotTime = form.slotTime as SlotTime
  const travelFee = travelFeeForEmirate(emirate)
  const distance = distanceClassForEmirate(emirate)

  const input: BookingHoldInput = {
    customerName: form.customerName.trim(),
    customerPhone: form.customerPhone.trim(),
    customerEmail: form.customerEmail.trim() || null,
    emirate,
    address: form.address.trim(),
    locationLat: form.locationLat,
    locationLng: form.locationLng,
    parkingType: (form.parkingType as ParkingType) || null,
    additionalNotes: form.additionalNotes.trim() || null,
    carMake: form.carMake.trim(),
    carModel: form.carModel.trim(),
    carYear: form.carYear,
    // VIN / plate inputs were removed from the public checkout (conversion); the
    // columns + RPC params remain, so always send null for website bookings.
    vin: null,
    plateNumber: null,
    inspectionDate: form.inspectionDate,
    slotTime,
    packageId: pkg.id,
    packageName: pkg.name,
    packagePrice: pkg.price,
    travelFee,
    totalPrice: pkg.price + travelFee,
  }

  // 1) Pre-check availability for the chosen date/slot. This is a friendly early
  //    exit only — the authoritative, atomic check is createBookingHold below.
  try {
    const slots = await getSlotAvailability(form.inspectionDate, distance)
    const chosen = slots.find((s) => s.slot === slotTime)
    if (!chosen || !chosen.available) {
      return NextResponse.json({ ok: false, error: UNAVAILABLE_MESSAGE }, { status: 409 })
    }
  } catch (err) {
    console.error('[booking] availability check failed', err)
    return NextResponse.json(
      { ok: false, error: 'We could not check availability just now. Please try again.' },
      { status: 500 },
    )
  }

  // 2) Insert the payment hold. The create_booking_hold RPC validates every slot
  //    rule atomically and returns the row, including the DB-generated reference;
  //    a concurrent insert for the same slot loses the race and raises
  //    SLOT_UNAVAILABLE (→ 409).
  let booking
  try {
    booking = await createBookingHold(input)
  } catch (err) {
    if (err instanceof SlotUnavailableError) {
      return NextResponse.json({ ok: false, error: UNAVAILABLE_MESSAGE }, { status: 409 })
    }
    console.error('[booking] failed to create hold', err)
    return NextResponse.json(
      { ok: false, error: 'We could not save your request just now. Please try again.' },
      { status: 500 },
    )
  }

  // 3) Create the Stripe Checkout Session and persist its id on the hold.
  try {
    const session = await createCheckoutSession(rowToRecord(booking), appUrl(req))
    if (!session.url) throw new Error('Stripe session has no URL')
    await attachStripeSession(booking.id, session.id)
    return NextResponse.json({ ok: true, checkoutUrl: session.url, bookingId: booking.id })
  } catch (err) {
    console.error('[booking] Stripe session creation failed', err)
    // Release the hold so the slot frees immediately instead of waiting 30 min.
    await releaseHold(booking.id).catch(() => {})
    return NextResponse.json(
      { ok: false, error: 'We could not start the payment. Please try again.' },
      { status: 502 },
    )
  }
}
