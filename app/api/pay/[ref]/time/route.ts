import { NextResponse } from 'next/server'
import { choosePayTime, getPayAlternatives, getPayLink, isPayRef } from '@/lib/pay-link'
import { clientIp, rateLimitOk } from '@/lib/rate-limit'

/**
 * The original time was taken: the customer taps one of the offered times, or
 * "I'm flexible — closest available" (flexible = consent recorded). The SAME
 * booking and link move there — nothing is reserved until they pay (v443: no
 * second hold).
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const SLOT_RE = /^([01]\d|2[0-3]):(00|15|30|45)$/

export async function POST(req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  if (!isPayRef(ref)) return NextResponse.json({ ok: false, error: 'Booking not found.' }, { status: 404 })
  if (!(await rateLimitOk(`pay-time:${clientIp(req)}`, 10, 60))) {
    return NextResponse.json({ ok: false, error: 'Too many attempts — please wait a minute.' }, { status: 429 })
  }
  const body = (await req.json().catch(() => ({}))) as { date?: unknown; slot?: unknown; flexible?: unknown }
  const date = typeof body.date === 'string' ? body.date : ''
  const slot = typeof body.slot === 'string' ? body.slot : ''
  const flexible = body.flexible === true
  if (!DATE_RE.test(date) || !SLOT_RE.test(slot)) return NextResponse.json({ ok: false, error: 'Pick one of the times shown.' }, { status: 422 })

  const link = await getPayLink(ref).catch(() => null)
  if (!link || link.paid_at || (link.state !== 'time_taken' && link.state !== 'available_unreserved')) {
    return NextResponse.json({ ok: false, error: 'This booking can’t be moved here — please contact us.' }, { status: 409 })
  }
  // Only a time the page actually offers. pay_link_choose_time checks just that
  // someone is free, so a hand-made request could otherwise move the booking to a
  // past time (unpayable), before opening hours or weeks away. The offered list
  // is nearest-first, so the page's three are always inside these six.
  const offered = await getPayAlternatives(ref, 6)
  if (!offered.some((a) => a.inspection_date === date && a.slot_time === slot)) {
    return NextResponse.json({ ok: false, error: 'That time was just taken — please pick another.' }, { status: 409 })
  }
  const r = await choosePayTime(ref, date, slot, flexible)
  if (r === 'taken') return NextResponse.json({ ok: false, error: 'That time was just taken — please pick another.' }, { status: 409 })
  if (r === 'error') return NextResponse.json({ ok: false, error: 'Could not change the time. Please try again.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
