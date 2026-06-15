import { NextResponse } from 'next/server'
import { getSlotAvailability } from '@/lib/availability'
import { clientIp, rateLimitOk } from '@/lib/rate-limit'
import type { DistanceClass } from '@/types/booking'

/**
 * GET /api/availability?date=yyyy-mm-dd&distance=normal|long
 *
 * Returns availability for all 5 daily slots on the given date — never any
 * customer or booking detail. The booking_slot_availability RPC sweeps stale
 * holds internally, so there is no separate expiry step here.
 *
 * When Supabase isn't configured (keyless preview build) getSlotAvailability
 * returns every slot as available (long-distance → only 09:30) so the checkout
 * UI still renders.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Local yyyy-mm-dd for "today" (UAE has no DST, server may be UTC — close enough
 *  for a not-in-the-past guard; the API also relies on the DB for real conflicts). */
function todayISO(): string {
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}

export async function GET(req: Request) {
  // Anti-abuse: higher burst than the write endpoints (the checkout UI polls
  // this as the customer browses dates), but still bounded against enumeration.
  if (!(await rateLimitOk(`avail:${clientIp(req)}`, 60, 60))) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please slow down.' },
      { status: 429 },
    )
  }

  const params = new URL(req.url).searchParams
  const date = params.get('date') ?? ''
  const distanceParam = params.get('distance') ?? 'normal'

  if (!DATE_RE.test(date)) {
    return NextResponse.json(
      { ok: false, error: 'A valid date (yyyy-mm-dd) is required.' },
      { status: 400 },
    )
  }
  // Reject obviously invalid calendar dates (e.g. 2026-13-40).
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    return NextResponse.json({ ok: false, error: 'Invalid date.' }, { status: 400 })
  }
  if (date < todayISO()) {
    return NextResponse.json({ ok: false, error: 'Date is in the past.' }, { status: 400 })
  }

  if (distanceParam !== 'normal' && distanceParam !== 'long') {
    return NextResponse.json(
      { ok: false, error: 'distance must be "normal" or "long".' },
      { status: 400 },
    )
  }
  const distance: DistanceClass = distanceParam

  try {
    const slots = await getSlotAvailability(date, distance)
    return NextResponse.json({ ok: true, date, slots })
  } catch (err) {
    console.error('[availability] lookup failed', err)
    return NextResponse.json(
      { ok: false, error: 'Could not check availability.' },
      { status: 500 },
    )
  }
}
