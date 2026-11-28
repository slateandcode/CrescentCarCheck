import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

/**
 * The customer payment link — crescentcarcheck.com/pay/CCB-XXXXXX (server-only).
 *
 * Staff create the booking in the Crescent Car Reports admin app (phone /
 * WhatsApp enquiry → "Finish booking") and send this link. The booking's rules
 * live in that app's database (migrations 032–033); this module wraps its
 * SECURITY DEFINER RPCs:
 *
 *   pay_link_state           what the page shows (hold live, still free, time
 *                            taken, details needed, balance due, done…)
 *   pay_link_alternatives    nearby free times when the original was taken
 *   pay_link_choose_time     move the SAME booking to one of them (no new hold)
 *   pay_link_submit_details  exact pin + seller / showroom number after paying
 *   commit_link_payment      the capacity lock, run by the webhook BEFORE the
 *                            card is captured — first to pay wins
 *   confirm_balance_paid     a deposit booking's balance, paid on the same link
 *
 * Self-serve checkout (/checkout) is unchanged and does not use this module.
 */

export type PayState =
  | 'not_found'
  | 'cancelled'
  | 'offline' // bank transfer / cash / invoice — nothing to pay online
  | 'hold_active' // the 30-minute hold is live: pay now, the time is reserved
  | 'available_unreserved' // the hold ran out but the time is still free — not reserved
  | 'time_taken' // the time went to someone else: pick another
  | 'details_needed' // paid — now the exact pin + seller number
  | 'balance_due' // deposit paid + details in — the balance is due on this link
  | 'done'

export interface PayLink {
  state: PayState
  id: string
  customer_first_name: string
  package_name: string
  vehicle: string
  inspection_date: string
  slot_time: string
  original_inspection_date: string | null
  original_slot_time: string | null
  area: string
  emirate: string
  total_aed: number
  deposit_aed: number | null
  balance_aed: number | null
  due_now_aed: number
  payment_method: 'online' | 'bank_transfer' | 'cash' | 'deposit' | 'invoice'
  hold_expires_at: string | null
  paid_at: string | null
  balance_paid_at: string | null
  details_submitted_at: string | null
  /** Last 3 digits of the seller's number the customer sent (never the whole number). */
  seller_phone_hint?: string | null
  /** The exact location pin / Maps link was received. */
  pin_received?: boolean
}

const REF_RE = /^CCB-[A-Z0-9]{6}$/

export const isPayRef = (ref: string) => REF_RE.test(ref)

function db() {
  return createServerClient()
}

export async function getPayLink(ref: string): Promise<PayLink | null> {
  if (!isSupabaseConfigured() || !isPayRef(ref)) return null
  const { data, error } = await db().rpc('pay_link_state', { p_id: ref })
  if (error) {
    console.error('[pay-link] state failed', { ref }, error)
    throw error
  }
  const row = data as PayLink | { state: 'not_found' } | null
  if (!row || row.state === 'not_found') return null
  return row as PayLink
}

export async function getPayAlternatives(ref: string, limit = 3): Promise<{ inspection_date: string; slot_time: string }[]> {
  if (!isSupabaseConfigured() || !isPayRef(ref)) return []
  const { data, error } = await db().rpc('pay_link_alternatives', { p_id: ref, p_limit: limit })
  if (error) {
    console.error('[pay-link] alternatives failed', { ref }, error)
    return []
  }
  return (data as { inspection_date: string; slot_time: string }[]) ?? []
}

export async function choosePayTime(ref: string, date: string, slot: string, flexible: boolean): Promise<'ok' | 'taken' | 'error'> {
  const { error } = await db().rpc('pay_link_choose_time', { p_id: ref, p_date: date, p_slot: slot, p_flexible: flexible })
  if (!error) return 'ok'
  if (error.message.includes('CAPACITY_TAKEN')) return 'taken'
  console.error('[pay-link] choose time failed', { ref }, error)
  return 'error'
}

export async function submitPayDetails(
  ref: string,
  d: { sellerPhone: string; locationUrl: string; lat: number | null; lng: number | null; address: string },
): Promise<'ok' | 'invalid' | 'error'> {
  const { error } = await db().rpc('pay_link_submit_details', {
    p_id: ref,
    p_seller_phone: d.sellerPhone,
    p_location_url: d.locationUrl,
    p_lat: d.lat,
    p_lng: d.lng,
    p_address: d.address,
  })
  if (!error) return 'ok'
  if (/SELLER_PHONE_REQUIRED|LOCATION_REQUIRED|NOT_PAID/.test(error.message)) return 'invalid'
  console.error('[pay-link] details failed', { ref }, error)
  return 'error'
}

/**
 * Stripe's smallest card payment in AED (its documented minimum charge). Below
 * it Stripe refuses to create the Checkout session, so a link for less can't be
 * paid online — the page says so plainly instead of "Could not start the payment"
 * (Ronit 2026-11-28 tried a 1 AED test link).
 */
export const STRIPE_MIN_AED = 2

/** Fils (1 AED = 100 fils), always a whole number for Stripe. */
export const toFils = (aed: number) => Math.round(Number(aed) * 100)

/** 'booking' = the full price · 'deposit' = the deposit · 'balance' = a deposit booking's balance. */
export type PayKind = 'booking' | 'deposit' | 'balance'

export function payKindOf(link: PayLink): PayKind | null {
  if (link.state === 'balance_due') return 'balance'
  if (link.state === 'hold_active' || link.state === 'available_unreserved') return link.payment_method === 'deposit' ? 'deposit' : 'booking'
  return null
}

/**
 * Stripe Checkout for the link. The booking / deposit payment AUTHORISES only
 * (manual capture): the webhook runs the capacity lock and captures on success,
 * or cancels the authorisation so the card is never charged when the time went
 * to someone else (v443). The balance has no capacity question, so it captures
 * straight away. Apple Pay / Google Pay come with Checkout's card method.
 */
export async function createPayCheckout(link: PayLink, appUrl: string) {
  const kind = payKindOf(link)
  if (!kind || link.due_now_aed <= 0) throw new Error('Nothing to pay on this link right now.')
  if (toFils(link.due_now_aed) < STRIPE_MIN_AED * 100) throw new Error(`Below Stripe's AED ${STRIPE_MIN_AED} minimum.`)
  const label = kind === 'deposit' ? 'deposit' : kind === 'balance' ? 'balance' : 'inspection'
  return getStripe().checkout.sessions.create({
    mode: 'payment',
    // Stripe's floor is 30 minutes; the lock at payment is what protects the time.
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'aed',
          unit_amount: toFils(link.due_now_aed),
          product_data: {
            name: `Crescent Car Check - ${link.package_name} ${label}`,
            description: `${link.vehicle} · ${link.area}, ${link.emirate}`,
          },
        },
      },
    ],
    metadata: { booking_id: link.id, flow: 'pay_link', kind },
    payment_intent_data: {
      metadata: { booking_id: link.id, flow: 'pay_link', kind },
      ...(kind === 'balance' ? {} : { capture_method: 'manual' as const }),
    },
    success_url: `${appUrl}/pay/${encodeURIComponent(link.id)}?paid=1`,
    cancel_url: `${appUrl}/pay/${encodeURIComponent(link.id)}`,
  })
}

export type CommitResult = 'ok' | 'already_paid' | 'no_capacity' | 'not_payable'

export async function commitLinkPayment(ref: string, paymentIntentId: string | null): Promise<CommitResult> {
  const { data, error } = await db().rpc('commit_link_payment', { p_id: ref, p_payment_intent: paymentIntentId })
  if (error) throw error
  return (data as CommitResult) ?? 'not_payable'
}

/** True when this payment settled the balance; false when it was already settled (or isn't a deposit booking). */
export async function confirmBalancePaid(ref: string, paymentIntentId: string | null): Promise<boolean> {
  const { data, error } = await db().rpc('confirm_balance_paid', { p_id: ref, p_payment_intent: paymentIntentId })
  if (error) throw error
  // The RPC returns the updated row — or an empty (all-null) row when nothing matched.
  return Boolean((data as { id?: string | null } | null)?.id)
}

/** Ask the admin app to dispatch now (it also dispatches on its own page loads). Best-effort. */
export async function pingDispatch(): Promise<void> {
  const url = process.env.REPORTS_APP_URL
  const secret = process.env.DISPATCH_WEBHOOK_SECRET
  if (!url || !secret) return
  try {
    await fetch(`${url.replace(/\/$/, '')}/api/dispatch`, { method: 'POST', headers: { 'x-dispatch-secret': secret }, cache: 'no-store' })
  } catch (err) {
    console.error('[pay-link] dispatch ping failed (ignored)', err)
  }
}
