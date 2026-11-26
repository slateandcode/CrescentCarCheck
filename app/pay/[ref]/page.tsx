import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayAlternatives, getPayLink, isPayRef, type PayLink } from '@/lib/pay-link'
import { PayPanel } from '@/components/pay/PayPanel'

export const metadata: Metadata = {
  title: 'Your Booking',
  description: 'Pay for your Crescent Car Check inspection and share the car’s exact location.',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

/** "Sat 10 Oct · 2:00 PM" (Dubai calendar date + quarter-hour time). */
function whenLabel(date: string, slot: string): string {
  const [h, m] = slot.split(':').map(Number)
  const h12 = h % 12 === 0 ? 12 : h % 12
  const day = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
  return `${day} · ${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

const HEADLINES: Record<PayLink['state'], [string, string]> = {
  not_found: ['Booking not found', ''],
  cancelled: ['This booking was cancelled', 'Message us on WhatsApp and we’ll find you a new time.'],
  offline: ['Your inspection is booked', 'Nothing to pay online for this booking.'],
  hold_active: ['Confirm your inspection', 'Your time is reserved — pay now to lock it in.'],
  available_unreserved: ['Confirm your inspection', 'Your time is still free — it isn’t reserved while this page is open, so pay to lock it in.'],
  time_taken: ['Pick a new time', 'Your original time was taken before payment. Choose another below — nothing is charged until you pay.'],
  details_needed: ['Payment received — one last step', 'Tell us exactly where the car is and who to call on the day.'],
  balance_due: ['Pay the balance', 'Your deposit is in. Pay the rest whenever you’re ready.'],
  done: ['You’re all set', 'We’ll confirm the inspector’s arrival time on WhatsApp.'],
}

/**
 * The customer's booking link (crescentcarcheck.com/pay/CCB-…), sent by staff
 * from the admin app. One link does everything: pay (or pay the deposit), pick
 * another time if the original was taken, then share the exact pin and the
 * seller's number — and later the balance on a deposit booking (v432 / v449).
 */
export default async function PayPage({ params, searchParams }: { params: Promise<{ ref: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const [{ ref }, sp] = await Promise.all([params, searchParams])
  if (!isPayRef(ref)) notFound()
  const link = await getPayLink(ref).catch(() => null)
  if (!link) notFound()
  const alternatives = link.state === 'time_taken' ? await getPayAlternatives(ref, 3) : []
  const [title, sub] = HEADLINES[link.state]

  return (
    <>
      <section className="bg-background page-header">
        <div className="container-wide">
          <div className="max-w-3xl">
            <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-3">Booking {link.id}</p>
            <h1 className="text-display-md sm:text-display-lg font-black text-text-primary leading-[1.05] break-words">{title}</h1>
            {sub && <p className="text-text-secondary text-base md:text-lg mt-5 max-w-2xl leading-relaxed">{sub}</p>}
          </div>
        </div>
      </section>

      <section className="bg-light-bg section-padding">
        <div className="container-wide">
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-[1fr_1.2fr]">
            <aside className="h-fit rounded-card-lg border border-light-border bg-light-card p-6">
              <p className="text-light-text-muted text-xs font-semibold uppercase tracking-wider">Your inspection</p>
              <p className="text-light-text mt-2 text-xl font-bold">
                {link.package_name} · {link.vehicle}
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <Row k="When" v={whenLabel(link.inspection_date, link.slot_time)} />
                {link.original_slot_time && link.original_inspection_date && (link.original_slot_time !== link.slot_time || link.original_inspection_date !== link.inspection_date) && (
                  <Row k="Originally" v={whenLabel(link.original_inspection_date, link.original_slot_time)} muted />
                )}
                <Row k="Where" v={`${link.area}, ${link.emirate}`} />
                <Row k="Total" v={`AED ${link.total_aed}`} />
                {link.deposit_aed != null && (
                  <>
                    <Row k="Deposit" v={`AED ${link.deposit_aed}${link.paid_at ? ' · paid' : ' · due now'}`} />
                    <Row k="Balance" v={`AED ${link.balance_aed ?? 0}${link.balance_paid_at ? ' · paid' : ' · after the inspection'}`} />
                  </>
                )}
              </dl>
            </aside>

            <PayPanel link={link} alternatives={alternatives.map((a) => ({ ...a, label: whenLabel(a.inspection_date, a.slot_time) }))} justPaid={sp.paid === '1'} />
          </div>
        </div>
      </section>
    </>
  )
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-light-text-muted">{k}</dt>
      <dd className={muted ? 'text-light-text-muted line-through' : 'text-light-text font-medium text-right'}>{v}</dd>
    </div>
  )
}
