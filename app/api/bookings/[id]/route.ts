import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getBookingById } from '@/lib/availability'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { getCheckoutAmounts, isStripeConfigured } from '@/lib/stripe'

/**
 * GET /api/bookings/{id}?session_id=cs_...
 *
 * Lightweight summary for the post-payment confirmation page. Returns ONLY
 * non-sensitive fields (package, total, date/slot, payment + booking status) —
 * never customer PII. The caller must supply the matching Stripe session_id, so a
 * booking id alone can't be enumerated.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const sessionId = req.nextUrl.searchParams.get('session_id')

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Not available.' }, { status: 404 })
  }

  let booking
  try {
    booking = await getBookingById(id)
  } catch (err) {
    console.error('[booking] summary lookup failed', err)
    return NextResponse.json({ ok: false, error: 'Lookup failed.' }, { status: 500 })
  }

  // Require the session id to match — prevents guessing references to read others.
  if (!booking || !sessionId || booking.stripe_session_id !== sessionId) {
    return NextResponse.json({ ok: false, error: 'Booking not found.' }, { status: 404 })
  }

  // What the customer was actually charged, after any promotion code. total_price
  // is the list price stamped on the hold; with a discount applied the real charge
  // is lower, so read it from Stripe for the confirmation display + GA purchase
  // value. Best-effort — falls back to the stored total if Stripe can't be read.
  let amountPaid = booking.total_price
  let discount = 0
  if (booking.payment_status === 'paid' && isStripeConfigured()) {
    const amounts = await getCheckoutAmounts(sessionId)
    if (amounts) {
      amountPaid = amounts.amountPaid
      discount = amounts.discount
    }
  }

  return NextResponse.json({
    ok: true,
    booking: {
      id: booking.id,
      packageId: booking.package_id,
      packageName: booking.package_name,
      packagePrice: booking.package_price,
      travelFee: booking.travel_fee,
      totalPrice: booking.total_price,
      amountPaid,
      discount,
      inspectionDate: booking.inspection_date,
      slotTime: booking.slot_time,
      paymentStatus: booking.payment_status,
      bookingStatus: booking.booking_status,
    },
  })
}
