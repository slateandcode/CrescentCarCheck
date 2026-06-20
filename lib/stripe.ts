import Stripe from 'stripe'
import { HOLD_MINUTES } from '@/lib/availability'
import type { BookingRecord } from '@/types/booking'

/**
 * Lazy Stripe client.
 *
 * Importing this module must NEVER throw — the site ships before the client has
 * provisioned a Stripe account, and route handlers may import this file while
 * keys are still empty. We therefore defer the "key is required" error until the
 * client is actually used (getStripe()), and expose isStripeConfigured() so
 * callers can branch instead of throwing.
 */
let client: Stripe | null = null

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set — cannot create a Stripe client.')
  }
  if (!client) {
    client = new Stripe(key, {
      apiVersion: '2026-04-22.dahlia',
      typescript: true,
      appInfo: {
        name: 'Crescent Car Check',
        version: '1.0.0',
      },
    })
  }
  return client
}

/**
 * Reads what a completed Checkout session ACTUALLY charged, after any promotion
 * code (amount_total / total_details are in fils → returned as AED). Best-effort:
 * returns null if the session can't be read, so callers fall back to the booking's
 * stored list total_price. Used by the confirmation summary + GA purchase value so
 * a discounted booking doesn't display / report the undiscounted price.
 */
export async function getCheckoutAmounts(
  sessionId: string,
): Promise<{ amountPaid: number; discount: number; promoCode: string | null } | null> {
  try {
    // Expand the promotion_code so we can read the customer-facing code STRING
    // (e.g. 'CRESCENT50'); the bare session only carries its id. amount_total /
    // total_details are present without expansion.
    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['discounts.promotion_code'],
    })
    if (typeof session.amount_total !== 'number') return null
    const promo = session.discounts?.[0]?.promotion_code
    return {
      amountPaid: session.amount_total / 100,
      discount:
        typeof session.total_details?.amount_discount === 'number'
          ? session.total_details.amount_discount / 100
          : 0,
      // When expanded, promotion_code is the object; fall back to null for a bare
      // id or a discount applied via a raw coupon (no customer-typed code).
      promoCode: promo && typeof promo === 'object' ? promo.code : null,
    }
  } catch (err) {
    console.error('[stripe] failed to read checkout amounts', { sessionId }, err)
    return null
  }
}

/**
 * Creates a Stripe Checkout Session for a booking hold. The amount and name are
 * derived from the server-built record (never client-sent money). booking_id is
 * stamped in metadata so the webhook can resolve the booking on success/expiry.
 */
export async function createCheckoutSession(
  record: BookingRecord,
  appUrl: string,
): Promise<Stripe.Checkout.Session> {
  return getStripe().checkout.sessions.create({
    mode: 'payment',
    // Show Stripe Checkout's built-in "Add promotion code" field. Codes are
    // created and managed by the business in the Stripe Dashboard (Products →
    // Coupons → Promotion codes): percentage or fixed-AED off, expiry, redemption
    // caps, first-time-only, minimum order, etc. Stripe validates them entirely
    // server-side, so there is no code-validation endpoint to build or secure here.
    // The discount is reflected in amount_total/total_details on the resulting
    // session — see the webhook (handlePaid), which records what was actually paid.
    allow_promotion_codes: true,
    // Stripe Checkout sessions default to a 24h lifetime, but the database payment
    // hold only lives HOLD_MINUTES (30). Cap the session so an abandoned checkout
    // can't be completed long after its slot was released. Stripe requires the
    // expiry to be >= 30 min in the future, so we add a small buffer above that
    // floor to survive clock skew / network latency. This only SHRINKS the window;
    // the webhook (handlePaid) is the durable guard that auto-refunds a payment
    // that still lands after the hold was freed.
    expires_at: Math.floor(Date.now() / 1000) + (HOLD_MINUTES + 5) * 60,
    // Charge in AED. unit_amount is in fils (1 AED = 100 fils).
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'aed',
          unit_amount: record.totalPrice * 100,
          product_data: {
            name: `Crescent Car Check - ${record.packageName} Inspection`,
            description: `${record.carMake} ${record.carModel} (${record.carYear}) · ${record.emirate}`,
          },
        },
      },
    ],
    ...(record.customerEmail ? { customer_email: record.customerEmail } : {}),
    metadata: {
      booking_id: record.id,
      package_id: record.packageId,
      inspection_date: record.inspectionDate,
      slot_time: record.slotTime,
    },
    // Checkout does NOT copy session metadata onto the underlying PaymentIntent,
    // so stamp booking_id there too — the payment_intent.payment_failed webhook
    // branch resolves the booking from the PaymentIntent's metadata.
    payment_intent_data: {
      metadata: { booking_id: record.id },
    },
    success_url: `${appUrl}/confirmation?id=${encodeURIComponent(record.id)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout?package=${record.packageId}&cancelled=1`,
  })
}
