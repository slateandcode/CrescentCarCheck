'use client'

import Link from 'next/link'
import { Check, ShieldCheck, FileText, MapPin } from 'lucide-react'
import { TRAVEL_FEE } from '@/lib/packages'
import type { Emirate, Package } from '@/types/booking'

interface PackageSummaryProps {
  pkg: Package
  /** Selected location; drives the travel-fee line. Empty until chosen. */
  emirate?: Emirate | ''
  /** Flat travel surcharge for the selected location (0 for none). */
  travelFee?: number
}

const TRUST_POINTS = [
  { Icon: MapPin, text: 'On-site at the seller’s location' },
  { Icon: FileText, text: 'Digital report delivered the same day' },
  { Icon: ShieldCheck, text: 'Independent — no ties to any seller' },
] as const

export function PackageSummary({ pkg, emirate = '', travelFee = 0 }: PackageSummaryProps) {
  const total = pkg.price + travelFee
  return (
    <aside
      className="
        bg-light-card rounded-card-lg border border-light-border
        shadow-[0_8px_24px_rgba(0,0,0,0.06)]
        p-5 sm:p-6
      "
      aria-label="Order summary"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-light-text font-bold text-lg">{pkg.name}</h2>
        {pkg.recommended && (
          <span className="text-xs font-bold uppercase tracking-wider text-error">
            Recommended
          </span>
        )}
      </div>
      <p className="text-light-text-secondary text-sm mt-1 leading-snug">{pkg.tagline}</p>

      <div className="mt-4 pb-4 border-b border-light-border">
        {/* Line items: base price, then a travel fee once an emirate is chosen. */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-light-text-secondary">Inspection ({pkg.name})</span>
            <span className="text-light-text font-semibold">AED {pkg.price}</span>
          </div>
          {travelFee > 0 && (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-light-text-secondary">
                Travel fee{emirate ? ` (${emirate})` : ''}
              </span>
              <span className="text-light-text font-semibold">AED {travelFee}</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-light-text-muted uppercase tracking-wider font-semibold">
              Total today
            </p>
            <p className="text-light-text text-3xl font-black leading-none mt-1">
              AED {total}
            </p>
            <p className="text-xs text-light-text-muted mt-1">Inclusive of VAT</p>
          </div>
          <Link
            href="/packages"
            className="text-xs font-semibold text-accent hover:underline whitespace-nowrap"
          >
            Change package
          </Link>
        </div>

        {!emirate && (
          <p className="text-xs text-light-text-muted mt-3 leading-snug">
            Select your emirate below — a flat AED {TRAVEL_FEE} travel fee applies to Abu
            Dhabi, Al Ain, Ras Al Khaimah and Fujairah.
          </p>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-light-text-secondary uppercase tracking-wider mb-2">
          What&apos;s included
        </p>
        <ul className="space-y-1.5">
          {pkg.features.slice(0, 5).map((f) => (
            <li key={f} className="flex items-start gap-2 text-xs text-light-text-secondary">
              <Check className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span className="leading-snug">{f}</span>
            </li>
          ))}
          {pkg.features.length > 5 && (
            <li className="text-xs text-light-text-muted pl-5">
              +{pkg.features.length - 5} more checks
            </li>
          )}
        </ul>
      </div>

      <div className="mt-5 pt-5 border-t border-light-border space-y-2">
        {TRUST_POINTS.map(({ Icon, text }) => (
          <p
            key={text}
            className="text-light-text-muted text-xs flex items-start gap-2 leading-snug"
          >
            <Icon className="w-3.5 h-3.5 text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{text}</span>
          </p>
        ))}
      </div>
    </aside>
  )
}
