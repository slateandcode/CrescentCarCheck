'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Clock, Landmark, MessageCircle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LocationMap } from '@/components/checkout/LocationMap'
import type { PayLink } from '@/lib/pay-link'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '971588425010'

interface Alt {
  inspection_date: string
  slot_time: string
  label: string
}

const CARD = 'rounded-card-lg border border-light-border bg-light-card p-6'

/**
 * Everything the customer does on their booking link, one state at a time:
 * pay (or pay the deposit) · pick another time · share the exact pin and the
 * seller's number · pay the balance · done.
 */
export function PayPanel({ link, alternatives, justPaid }: { link: PayLink; alternatives: Alt[]; justPaid: boolean }) {
  const router = useRouter()

  // Back from Stripe: the webhook confirms a few seconds later — refresh until it
  // has. After ~30 s stop waiting and show the link's real state again (with a
  // note), rather than "finishing up" forever with no way forward.
  const [gaveUp, setGaveUp] = useState(false)
  const waitingForWebhook = justPaid && !gaveUp && (link.state === 'hold_active' || link.state === 'available_unreserved' || link.state === 'balance_due')
  useEffect(() => {
    if (!waitingForWebhook) return
    let n = 0
    const t = setInterval(() => {
      n += 1
      router.refresh()
      if (n >= 10) {
        clearInterval(t)
        setGaveUp(true)
      }
    }, 3000)
    return () => clearInterval(t)
  }, [waitingForWebhook, router])

  if (waitingForWebhook) {
    return (
      <div className={CARD}>
        <p className="text-light-text text-lg font-bold">Payment received — finishing up…</p>
        <p className="text-light-text-secondary mt-2 text-sm leading-relaxed">This takes a few seconds. If your time was taken while you paid, your card won’t be charged and you’ll be able to pick another.</p>
      </div>
    )
  }

  switch (link.state) {
    case 'hold_active':
    case 'available_unreserved':
    case 'balance_due':
      return (
        <>
          {justPaid && gaveUp && (
            <p className="mb-4 rounded-card border border-light-border bg-light-card px-4 py-3 text-sm text-light-text-secondary">
              We haven’t received your payment confirmation yet. If your card was charged, please don’t pay again — message us on WhatsApp with reference{' '}
              <span className="font-semibold">{link.id}</span> and we’ll confirm it.
            </p>
          )}
          <PayCard link={link} />
        </>
      )
    case 'time_taken':
      return <NewTime link={link} alternatives={alternatives} onDone={() => router.refresh()} />
    case 'details_needed':
      return <DetailsForm link={link} onDone={() => router.refresh()} />
    case 'done':
      return (
        <div className={CARD}>
          <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
          <p className="text-light-text mt-3 text-lg font-bold">You’re all set</p>
          <p className="text-light-text-secondary mt-2 text-sm leading-relaxed">
            Reference <span className="font-semibold">{link.id}</span>. We’ll confirm the inspector’s arrival time on WhatsApp, and your report arrives the moment the inspection ends.
          </p>
          {link.details_submitted_at && (
            <ul className="text-light-text mt-4 space-y-1.5 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
                Seller’s number received{link.seller_phone_hint ? ` (ending ${link.seller_phone_hint})` : ''}
              </li>
              {link.pin_received !== false && (
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
                  Exact location pin received
                </li>
              )}
            </ul>
          )}
        </div>
      )
    case 'offline':
      return (
        <div className={CARD}>
          {link.payment_method === 'bank_transfer' ? (
            <>
              <Landmark className="h-7 w-7 text-light-text" aria-hidden />
              <p className="text-light-text mt-3 text-lg font-bold">Pay by bank transfer</p>
              <p className="text-light-text-secondary mt-2 text-sm leading-relaxed">
                Transfer <span className="font-semibold">AED {link.total_aed}</span> using <span className="font-semibold">{link.id}</span> as the reference. We confirm your booking as soon as the funds arrive. Need the bank details? Message us on WhatsApp.
              </p>
            </>
          ) : (
            <p className="text-light-text-secondary text-sm leading-relaxed">There’s nothing to pay online for this booking — our team has the details.</p>
          )}
          <WhatsAppLink />
        </div>
      )
    case 'cancelled':
    default:
      return (
        <div className={CARD}>
          <p className="text-light-text-secondary text-sm leading-relaxed">This booking is no longer active.</p>
          <WhatsAppLink />
        </div>
      )
  }
}

function WhatsAppLink() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP}`}
      target="_blank"
      rel="noreferrer"
      className="text-light-text mt-4 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
    >
      <MessageCircle className="h-4 w-4" aria-hidden /> Message us on WhatsApp
    </a>
  )
}

function useCountdown(until: string | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!until) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [until])
  if (!until) return null
  const left = new Date(until).getTime() - now
  return left > 0 ? Math.ceil(left / 60_000) : 0
}

function PayCard({ link }: { link: PayLink }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const minutes = useCountdown(link.state === 'hold_active' ? link.hold_expires_at : null)
  const what = link.state === 'balance_due' ? 'the balance' : link.payment_method === 'deposit' ? 'the deposit' : 'your inspection'

  const pay = async () => {
    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/pay/${encodeURIComponent(link.id)}/checkout`, { method: 'POST' })
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string }
      if (!res.ok || !body.url) throw new Error(body.error || 'Could not start the payment.')
      window.location.href = body.url
    } catch (e) {
      setPending(false)
      setError(e instanceof Error ? e.message : 'Could not start the payment.')
    }
  }

  return (
    <div className={CARD}>
      <p className="text-light-text-muted text-xs font-semibold uppercase tracking-wider">Due now</p>
      <p className="text-light-text mt-1 text-display-sm font-black">AED {link.due_now_aed}</p>
      {link.payment_method === 'deposit' && link.state !== 'balance_due' && (
        <p className="text-light-text-secondary mt-1 text-sm">Deposit now · the remaining AED {link.balance_aed} is due after the inspection, on this same link.</p>
      )}
      {link.state === 'hold_active' && minutes !== null && minutes > 0 && (
        <p className="text-light-text-secondary mt-3 inline-flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" aria-hidden /> Your time is reserved for {minutes} more minute{minutes === 1 ? '' : 's'}.
        </p>
      )}
      <Button className="mt-5" size="lg" fullWidth loading={pending} onClick={pay}>
        Pay {what} · AED {link.due_now_aed}
      </Button>
      <p className="text-light-text-muted mt-3 inline-flex items-center gap-2 text-xs">
        <ShieldCheck className="h-4 w-4" aria-hidden /> Apple Pay, Google Pay or card — secured by Stripe.
      </p>
      {error && (
        <p className="mt-3 rounded-card border border-error/30 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function NewTime({ link, alternatives, onDone }: { link: PayLink; alternatives: Alt[]; onDone: () => void }) {
  // Which button is saving ('flex' = "I'm flexible — closest available").
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!alternatives.length) {
    return (
      <div className={CARD}>
        <p className="text-light-text text-lg font-bold">No free times nearby right now</p>
        <p className="text-light-text-secondary mt-2 text-sm leading-relaxed">Message us and we’ll find you the next free time. Nothing has been charged.</p>
        <WhatsAppLink />
      </div>
    )
  }

  // v456: tapping a time picks it; "I'm flexible" takes the closest one and records the consent.
  const save = async (a: Alt, flexible: boolean) => {
    const date = a.inspection_date
    const slot = a.slot_time
    setPending(flexible ? 'flex' : `${date}|${slot}`)
    setError(null)
    try {
      const res = await fetch(`/api/pay/${encodeURIComponent(link.id)}/time`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ date, slot, flexible }),
      })
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || !body.ok) throw new Error(body.error || 'Could not change the time.')
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change the time.')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className={CARD}>
      <p className="text-light-text text-lg font-bold">Closest free times</p>
      <p className="text-light-text-secondary mt-1 text-sm">Tap a time to move your booking there — nothing is charged until you pay.</p>
      <div className="mt-4 space-y-2">
        {alternatives.map((a) => {
          const v = `${a.inspection_date}|${a.slot_time}`
          return (
            <button
              key={v}
              type="button"
              disabled={pending !== null}
              onClick={() => save(a, false)}
              className="border-light-border bg-light-card text-light-text flex w-full items-center justify-between rounded-card border px-4 py-3 text-left text-sm font-semibold transition-colors hover:border-accent/50 disabled:opacity-60"
            >
              {a.label}
              <span className="text-light-text-muted text-xs font-medium">{pending === v ? 'Saving…' : 'Choose'}</span>
            </button>
          )
        })}
      </div>
      <Button className="mt-5" size="lg" fullWidth loading={pending === 'flex'} disabled={pending !== null} onClick={() => save(alternatives[0], true)}>
        I’m flexible — continue with the closest time
      </Button>
      {error && (
        <p className="mt-3 rounded-card border border-error/30 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function DetailsForm({ link, onDone }: { link: PayLink; onDone: () => void }) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState('')
  const [mapsLink, setMapsLink] = useState('')
  const [seller, setSeller] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/pay/${encodeURIComponent(link.id)}/details`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sellerPhone: seller, locationUrl: mapsLink, lat: coords?.lat ?? null, lng: coords?.lng ?? null, address }),
      })
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || !body.ok) throw new Error(body.error || 'Could not save the details.')
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the details.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={CARD}>
      <p className="text-light-text text-lg font-bold">Where exactly is the car?</p>
      <p className="text-light-text-secondary mt-1 text-sm">Drop the pin on the car — or paste a Google Maps link below.</p>
      <div className="mt-4">
        <LocationMap
          onChange={(c, addr) => {
            setCoords(c)
            setAddress(addr)
          }}
        />
      </div>
      <label className="mt-4 block text-sm">
        <span className="text-light-text font-semibold">Google Maps link (optional)</span>
        <input
          value={mapsLink}
          onChange={(e) => setMapsLink(e.target.value)}
          placeholder="https://maps.app.goo.gl/…"
          className="mt-1.5 w-full rounded-input border border-light-border bg-light-card px-4 py-3 text-light-text outline-none focus:border-accent"
        />
      </label>
      <label className="mt-4 block text-sm">
        <span className="text-light-text font-semibold">Seller or showroom phone number</span>
        <input
          value={seller}
          onChange={(e) => setSeller(e.target.value)}
          inputMode="tel"
          placeholder="+971 55 123 4567"
          className="mt-1.5 w-full rounded-input border border-light-border bg-light-card px-4 py-3 text-light-text outline-none focus:border-accent"
        />
        <span className="text-light-text-muted mt-1 block text-xs">So our inspector can reach whoever has the car on the day.</span>
      </label>
      <Button className="mt-5" size="lg" fullWidth loading={pending} disabled={(!coords && !mapsLink.trim()) || !seller.trim()} onClick={save}>
        Save details
      </Button>
      {error && (
        <p className="mt-3 rounded-card border border-error/30 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
