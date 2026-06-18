'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { slotLabel } from '@/lib/packages'
import { trackPurchase } from '@/lib/analytics'

interface BookingSummary {
  id: string
  packageName: string
  packagePrice: number
  travelFee: number
  totalPrice: number
  inspectionDate: string
  slotTime: string
  paymentStatus: string
  bookingStatus: string
}

export function ConfirmationDetails() {
  const search = useSearchParams()
  const id = search.get('id')
  const sessionId = search.get('session_id')

  const [summary, setSummary] = useState<BookingSummary | null>(null)
  // Fire the GA4 purchase conversion at most once per confirmed booking, even if
  // the effect re-runs or React remounts the component.
  const purchaseTracked = useRef(false)

  useEffect(() => {
    if (!id || !sessionId) return
    let active = true
    fetch(`/api/bookings/${encodeURIComponent(id)}?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('not found'))))
      .then((data: { ok?: boolean; booking?: BookingSummary }) => {
        if (!active || !data.ok || !data.booking) return
        setSummary(data.booking)
        if (!purchaseTracked.current && data.booking.paymentStatus === 'paid') {
          purchaseTracked.current = true
          trackPurchase(data.booking)
        }
      })
      .catch(() => {
        /* Reference is still shown below; details are a best-effort enhancement. */
      })
    return () => {
      active = false
    }
  }, [id, sessionId])

  if (!id) return null

  const slotText = summary ? slotLabel(summary.slotTime) : undefined

  return (
    <div
      className="
        mt-8 inline-flex flex-wrap items-center gap-x-6 gap-y-3
        bg-card rounded-card border border-border
        px-5 py-3.5
      "
    >
      <Detail label="Reference" value={id} mono />
      {summary && (
        <>
          <Detail label="Package" value={`${summary.packageName} · AED ${summary.totalPrice}`} />
          <Detail label="Date" value={summary.inspectionDate} />
          {slotText && <Detail label="Slot" value={slotText} />}
        </>
      )}
    </div>
  )
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">{label}</p>
      <p className={`text-text-primary mt-0.5 ${mono ? 'font-mono text-sm' : 'font-semibold text-sm'}`}>
        {value}
      </p>
    </div>
  )
}
