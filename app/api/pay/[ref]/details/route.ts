import { NextResponse } from 'next/server'
import { getPayLink, isPayRef, submitPayDetails } from '@/lib/pay-link'
import { clientIp, rateLimitOk } from '@/lib/rate-limit'

/**
 * After paying: the exact location (a pin or a Google Maps link) and the seller
 * / showroom number — both required. Collected after payment so checkout stays
 * quick (v306).
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const asText = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const asCoord = (v: unknown, max: number): number | null => (typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= max ? v : null)

export async function POST(req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params
  if (!isPayRef(ref)) return NextResponse.json({ ok: false, error: 'Booking not found.' }, { status: 404 })
  if (!(await rateLimitOk(`pay-details:${clientIp(req)}`, 10, 60))) {
    return NextResponse.json({ ok: false, error: 'Too many attempts — please wait a minute.' }, { status: 429 })
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const sellerPhone = asText(body.sellerPhone, 40)
  const locationUrl = asText(body.locationUrl, 500)
  const address = asText(body.address, 300)
  const lat = asCoord(body.lat, 90)
  const lng = asCoord(body.lng, 180)
  if (sellerPhone.replace(/\D/g, '').length < 7) return NextResponse.json({ ok: false, error: 'Enter the seller’s or showroom’s phone number.' }, { status: 422 })
  if (!locationUrl && (lat === null || lng === null)) return NextResponse.json({ ok: false, error: 'Drop the pin on the car’s exact location.' }, { status: 422 })
  if (locationUrl && !/^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|(www\.)?google\.[a-z.]+\/maps)/i.test(locationUrl)) {
    return NextResponse.json({ ok: false, error: 'Paste a Google Maps link, or drop the pin instead.' }, { status: 422 })
  }

  const link = await getPayLink(ref).catch(() => null)
  if (!link || !link.paid_at) return NextResponse.json({ ok: false, error: 'Pay first, then share the details.' }, { status: 409 })
  const r = await submitPayDetails(ref, { sellerPhone, locationUrl, lat, lng, address })
  if (r === 'invalid') return NextResponse.json({ ok: false, error: 'Please fill in both details.' }, { status: 422 })
  if (r === 'error') return NextResponse.json({ ok: false, error: 'Could not save the details. Please try again.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
