import { NextResponse } from 'next/server'
import { isStripeConfigured } from '@/lib/stripe'
import { createPayCheckout, getPayLink, isPayRef, payKindOf } from '@/lib/pay-link'
import { clientIp, rateLimitOk } from '@/lib/rate-limit'

/**
 * Start paying on a booking link: a Stripe Checkout session for what's due now
 * (the price, the deposit, or a deposit booking's balance). The amount always
 * comes from the database, never the browser.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function appUrl(req: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return new URL(req.url).origin
}

export async function POST(req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  if (!isPayRef(ref)) return NextResponse.json({ ok: false, error: 'Booking not found.' }, { status: 404 })
  if (!(await rateLimitOk(`pay:${clientIp(req)}`, 10, 60))) {
    return NextResponse.json({ ok: false, error: 'Too many attempts — please wait a minute.' }, { status: 429 })
  }
  if (!isStripeConfigured()) {
    return NextResponse.json({ ok: false, error: 'Online payment is temporarily unavailable. Please WhatsApp us.' }, { status: 503 })
  }
  try {
    const link = await getPayLink(ref)
    if (!link) return NextResponse.json({ ok: false, error: 'Booking not found.' }, { status: 404 })
    if (!payKindOf(link)) {
      return NextResponse.json(
        { ok: false, error: link.state === 'time_taken' ? 'That time is no longer available — please choose another.' : 'There’s nothing to pay on this booking right now.' },
        { status: 409 },
      )
    }
    const session = await createPayCheckout(link, appUrl(req))
    return NextResponse.json({ ok: true, url: session.url })
  } catch (err) {
    console.error('[pay] checkout failed', { ref }, err)
    return NextResponse.json({ ok: false, error: 'Could not start the payment. Please try again.' }, { status: 500 })
  }
}
