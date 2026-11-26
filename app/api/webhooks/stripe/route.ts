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
import { commitLinkPayment, confirmBalancePaid, pingDispatch } from '@/lib/pay-link'
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
        // Booking links from the admin app (/pay/CCB-…) authorise first and are
        // captured only after the capacity lock — see handleLinkPayment.
        if (session.metadata?.flow === 'pay_link') {
          await handleLinkPayment(session)
          break
        }
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
        // A booking link's checkout expiring does NOT cancel the booking: it
        // stays a soft hold and the customer can come back to the same link.
        if (session.metadata?.flow === 'pay_link') break
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

/**
 * A payment on a booking link (/pay/CCB-…), created by staff in the admin app.
 *
 * The booking / deposit payment was only AUTHORISED (manual capture). Here the
 * database runs the capacity lock (commit_link_payment): if the time is still
 * free — the hold's inspector, or anyone — the booking is marked paid and the
 * card is captured; if someone else got there first, the authorisation is
 * cancelled, so the card is never charged, and the admin app shows the
 * customer update to send ("first to pay wins", v443). A deposit booking's
 * balance has no capacity question and is captured by Stripe straight away.
 */
async function handleLinkPayment(session: Stripe.Checkout.Session): Promise<void> {
  const bookingId = session.metadata?.booking_id
  const kind = session.metadata?.kind
  if (!bookingId) return
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null)

  if (kind === 'balance') {
    if (session.payment_status !== 'paid') return
    const applied = await confirmBalancePaid(bookingId, paymentIntentId)
    if (!applied && paymentIntentId) {
      // Either a replay of this same payment (already recorded under its intent)…
      const existing = await getBookingById(bookingId)
      if (existing?.stripe_payment_intent_id === paymentIntentId) return
      // …or the balance was already settled — the inspector took it in cash, or
      // another tab paid first — so this charge is a duplicate: refund it, the
      // same way a payment that lands on a released hold is refunded.
      console.warn('[webhook] balance already settled — refunding the duplicate payment', { bookingId })
      await getStripe().refunds.create({ payment_intent: paymentIntentId }, { idempotencyKey: `balance-dup-refund-${paymentIntentId}` })
    }
    return
  }
  if (!paymentIntentId) return

  const stripe = getStripe()
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
  // A replay after we already captured or cancelled: nothing to do.
  if (intent.status !== 'requires_capture') return

  const result = await commitLinkPayment(bookingId, paymentIntentId)
  let capture = result === 'ok'
  if (result === 'already_paid') {
    // Paid by THIS payment on an earlier delivery whose capture didn't go
    // through → capture now. Paid by another payment (two tabs) → don't charge.
    const existing = await getBookingById(bookingId)
    capture = existing?.stripe_payment_intent_id === paymentIntentId
  }

  if (!capture) {
    await stripe.paymentIntents.cancel(paymentIntentId, {}, { idempotencyKey: `link-cancel-${paymentIntentId}` })
    console.warn('[webhook] link payment not committed — authorisation cancelled', { bookingId, result })
    return
  }

  await stripe.paymentIntents.capture(paymentIntentId, {}, { idempotencyKey: `link-capture-${paymentIntentId}` })
  if (result === 'ok') {
    const row = await getBookingById(bookingId)
    if (row) {
      const amountPaid = typeof session.amount_total === 'number' ? session.amount_total / 100 : rowToRecord(row as Booking).totalPrice
      await notifyPaidBooking(rowToRecord(row as Booking), { amountPaid, discount: 0 })
    }
    // Dispatch now rather than on the admin app's next page load.
    await pingDispatch()
  }
}
