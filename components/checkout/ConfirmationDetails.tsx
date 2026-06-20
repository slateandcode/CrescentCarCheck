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
  /** Actually charged after any promotion code (AED). Falls back to totalPrice. */
  amountPaid: number
  /** Saving from a promotion code (AED); 0 when none was used. */
  discount: number
  inspectionDate: string
  slotTime: string
  paymentStatus: string
  bookingStatus: string
}

/** AED amount for display — whole numbers stay clean, fractional show 2dp. */
function aed(amount: number): string {
  return Number.isInteger(amount) ? `${amount}` : amount.toFixed(2)
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
          <Detail label="Package" value={`${summary.packageName} · AED ${aed(summary.totalPrice)}`} />
          {summary.discount > 0 && (
            <>
              <Detail label="Discount applied" value={`−AED ${aed(summary.discount)}`} />
              <Detail label="Total paid" value={`AED ${aed(summary.amountPaid)}`} />
            </>
          )}
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
