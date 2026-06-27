import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getCheckoutAmounts, getStripe, isStripeConfigured } from '@/lib/stripe'
import {
  attachCalendarEvent,
  attachPaymentDetails,
  getBookingById,
  markBookingCancelled,
  markBookingPaid,
  markBookingRefunded,
  rowToRecord,
} from '@/lib/availability'
import { notifyLatePaymentRefund, notifyPaidBooking } from '@/lib/email'
import { createTentativeHold } from '@/lib/calendar'
import type { Booking } from '@/types/booking'

/**
 * Stripe webhook (server-only). The source of truth for payment outcome.
 *
 * - Reads the RAW body (required for signature verification).
 * - Verifies STRIPE_WEBHOOK_SECRET.
 * - checkout.session.completed (when payment_status is 'paid') → booking becomes
 *   paid + "New" (paid_new) via the confirm_booking_paid RPC, then owner/customer
 *   emails + a tentative calendar hold are sent. A 'completed' event for a
 *   delayed-notification method (Tabby/BNPL) arrives 'unpaid' and is deferred.
 * - checkout.session.async_payment_succeeded / async_payment_failed → handle a
 *   delayed-notification payment (settle / free the slot). INERT today: the
 *   Checkout session is card-only (lib/stripe.ts sets no payment_method_types),
 *   so these never fire. Before enabling a BNPL method (e.g. Tabby), extend
 *   HOLD_MINUTES first — see the async_payment_succeeded handler for why.
 * - checkout.session.expired / payment_intent.payment_failed → booking cancelled,
 *   freeing the window.
 *
 * Idempotent: the paid/cancelled transitions only fire on a still-pending hold
 * (conditional DB update), so repeated deliveries safely no-op and never send
 * duplicate emails.
 */

// Force the Node.js runtime: Stripe signature verification needs Node crypto and
// the un-parsed request body.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[webhook] Stripe not configured — ignoring event')
    return NextResponse.json({ ok: false, error: 'Not configured.' }, { status: 503 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ ok: false, error: 'Missing signature.' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = await getStripe().webhooks.constructEventAsync(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  } catch (err) {
    console.error('[webhook] signature verification failed', err)
    return NextResponse.json({ ok: false, error: 'Invalid signature.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        // Only fulfil once the payment has actually settled. Standard card
        // payments are 'paid' the moment the session completes; delayed-
        // notification methods (e.g. Tabby/BNPL, common in the UAE) arrive here
        // as 'unpaid' and settle later via async_payment_succeeded — fulfilling
        // now would confirm a booking + email the customer before money lands.
        if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
          await handlePaid(session)
        }
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        // A delayed-notification payment settled. confirm_booking_paid is
        // idempotent on a still-pending hold, so this safely confirms it.
        // ⚠️ This is INERT today (card-only Checkout). Before enabling any BNPL
        // method, extend the 30-minute payment hold (HOLD_MINUTES) to outlast the
        // method's settlement window — otherwise the hold will already have
        // expired when this fires and handlePaid would auto-refund a customer who
        // legitimately paid.
        await handlePaid(event.data.object)
        break
      }
      case 'checkout.session.async_payment_failed': {
        // A delayed-notification payment failed — free the held slot, exactly
        // like an expired session, instead of leaving a confirmed unpaid booking.
        const session = event.data.object
        const bookingId = session.metadata?.booking_id
        if (bookingId) await markBookingCancelled(bookingId)
        break
      }
      case 'checkout.session.expired': {
        const session = event.data.object
        const bookingId = session.metadata?.booking_id
        if (bookingId) await markBookingCancelled(bookingId)
        break
      }
      case 'payment_intent.payment_failed':
        // Intentionally a NO-OP. Stripe hosted Checkout lets the customer retry a
        // declined card on the SAME still-open session, firing this event on every
        // failed attempt. If we cancelled the hold here, a successful retry would
        // land on an already-cancelled booking: confirm_booking_paid returns null,
        // handlePaid treats the good charge as a late payment on a released hold,
        // AUTO-REFUNDS it, and frees the slot — silently destroying a real paid
        // booking (very common with UAE 3DS / regional cards that decline first).
        // Abandoned holds are freed by checkout.session.expired + the 30-minute
        // hold sweep instead, so no cancellation is needed here.
        break
      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break
    }
  } catch (err) {
    // Return 500 so Stripe retries — but only for genuine processing failures.
    console.error('[webhook] handler error', event.type, err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handlePaid(session: Stripe.Checkout.Session): Promise<void> {
  const bookingId = session.metadata?.booking_id
  if (!bookingId) {
    console.error('[webhook] checkout.session.completed without booking_id')
    return
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent?.id ?? null)

  // Idempotent: only a still-pending hold transitions; a repeat returns null.
  const row = await markBookingPaid(bookingId, paymentIntentId)
  if (!row) {
    // A null result means EITHER (a) the booking was already paid — a genuine
    // idempotent webhook replay — OR (b) the 30-minute hold was released/cancelled
    // before this payment landed (the customer paid on a stale Checkout session
    // after the slot was freed). Distinguish the two so we never silently keep
    // money for a slot the customer didn't actually get.
    const existing = await getBookingById(bookingId)
    if (existing?.payment_status === 'paid') {
      console.log('[webhook] booking already paid — no-op', { bookingId })
      return
    }
    // Late payment on a released hold: refund the charge and alert the owner.
    console.warn('[webhook] payment landed after hold release — auto-refunding', { bookingId })
    if (paymentIntentId) {
      try {
        await getStripe().refunds.create(
          { payment_intent: paymentIntentId },
          { idempotencyKey: `late-refund-${bookingId}` },
        )
      } catch (err) {
        console.error('[webhook] auto-refund failed — manual refund required', { bookingId }, err)
      }
    }
    // Gate the owner alert on the one-time payment_status → 'refunded' transition
    // so a Stripe redelivery (at-least-once / dashboard "Resend") of this same
    // event doesn't re-email. Unlike the happy path, this branch never reaches a
    // 'paid' state, so without the gate it would re-fire on every delivery.
    const shouldAlert = await markBookingRefunded(bookingId)
    if (existing && shouldAlert) {
      await notifyLatePaymentRefund(rowToRecord(existing as Booking), paymentIntentId)
    }
    return
  }

  const record = rowToRecord(row as Booking)

  // What the customer ACTUALLY paid. With a promotion code applied (Checkout's
  // allow_promotion_codes field), amount_total is below the booking's list
  // total_price, so derive the figures Stripe charged rather than the stamped
  // price. Amounts are in fils; total_details.amount_discount is the saving.
  // Falls back to the list total when Stripe omits the field (no discount).
  const amountPaid =
    typeof session.amount_total === 'number' ? session.amount_total / 100 : record.totalPrice
  const discount =
    typeof session.total_details?.amount_discount === 'number'
      ? session.total_details.amount_discount / 100
      : 0

  // Notify owner + customer. Best-effort (never throws).
  await notifyPaidBooking(record, { amountPaid, discount })

  // Persist what Stripe actually charged so the admin dashboard reflects the
  // discount, not the list total. Store RAW fils from the event (lossless for
  // percentage codes); the promo-code STRING needs a session retrieve, so it's
  // best-effort — if it fails we still record amount + discount. attachPaymentDetails
  // never throws, so this can never fail the paid booking.
  const amountPaidFils = typeof session.amount_total === 'number' ? session.amount_total : null
  const discountFils =
    typeof session.total_details?.amount_discount === 'number'
      ? session.total_details.amount_discount
      : null
  const promoCode = (await getCheckoutAmounts(session.id))?.promoCode ?? null
  await attachPaymentDetails(bookingId, { amountPaidFils, discountFils, promoCode })

  // Tentative calendar hold — must NOT fail the paid booking.
  try {
    const eventId = await createTentativeHold(record)
    if (eventId) await attachCalendarEvent(record.id, eventId)
  } catch (err) {
    console.error('[webhook] calendar hold failed (ignored)', err)
  }
}
