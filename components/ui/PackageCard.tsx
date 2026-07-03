'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
import type { Package, PackageFeature } from '@/types/booking'
import { cn } from '@/lib/utils'
import { trackEvent, GA_EVENTS } from '@/lib/analytics'

interface PackageCardProps {
  pkg: Package
  /** Where the CTA links; defaults to the package's checkout URL. */
  linkHref?: string
  onSelect?: (pkg: Package) => void
}

function FeatureItem({ label, included }: PackageFeature) {
  return (
    <li className="flex items-start gap-2">
      {/* Included → gold badge with a check; excluded → red badge with a cross.
          The badge carries the meaning visually; it's aria-hidden, the text label
          is what assistive tech reads. */}
      <span
        className={cn(
          'mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full',
          included ? 'bg-accent' : 'bg-error',
        )}
        aria-hidden="true"
      >
        {included ? (
          <Check className="h-2.5 w-2.5 text-background" strokeWidth={3.5} />
        ) : (
          <X className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />
        )}
      </span>
      <span className="text-[12.5px] leading-snug text-light-text-secondary">
        {label}
      </span>
    </li>
  )
}

function PackageCardComponent({ pkg, linkHref, onSelect }: PackageCardProps) {
  const isPremium = Boolean(pkg.recommended)

  const handleCtaClick = () => {
    trackEvent(GA_EVENTS.SELECT_PACKAGE, {
      package_name: pkg.name,
      package_price: pkg.price,
    })
    onSelect?.(pkg)
  }

  return (
    <div
      className={cn(
        // White card on the dark section — it reads cleanly against the black
        // background. The recommended tier carries a gold ring + soft glow and a
        // red "Recommended" ribbon.
        'relative flex flex-col rounded-card-lg bg-light-card p-6 sm:p-8',
        'transition-transform duration-300 motion-safe:hover:-translate-y-1',
        isPremium
          ? 'ring-2 ring-accent shadow-[0_0_60px_-18px_rgba(255,198,0,0.45)]'
          : 'ring-1 ring-light-border',
      )}
    >
      {isPremium && (
        <span className="absolute -top-3 right-5 z-10 rounded-md bg-error px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-[0_4px_14px_rgba(239,68,68,0.35)]">
          Recommended
        </span>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-light-text">{pkg.name} Inspection</h3>
          <p className="mt-1 text-sm text-light-text-secondary">{pkg.tagline}</p>
        </div>
        <div className="text-right">
          <p className="whitespace-nowrap text-3xl font-black leading-none tabular-nums text-accent">
            <span className="text-sm font-bold text-accent/80">AED </span>
            {pkg.price}
          </p>
          <p className="mt-1.5 text-[11px] font-medium text-light-text-muted">one-time</p>
        </div>
      </div>

      {/* Core checks — included in both packages (always a gold tick). */}
      <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-2">
        {pkg.coreFeatures.map((label) => (
          <FeatureItem key={label} label={label} included />
        ))}
      </ul>

      {/* Premium-only checks — gold tick on Premium, red cross on Standard. */}
      <div className="my-5 border-t border-dashed border-light-border pt-5">
        <ul className="grid grid-cols-2 gap-x-3 gap-y-2">
          {pkg.extraFeatures.map((f) => (
            <FeatureItem key={f.label} label={f.label} included={f.included} />
          ))}
        </ul>
      </div>

      <div className="mt-2 flex-1 flex flex-col justify-end">
        <Link
          href={linkHref ?? `/checkout?package=${pkg.id}`}
          onClick={handleCtaClick}
          className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-6 py-3.5 text-base font-bold text-background shadow-[0_8px_24px_rgba(255,198,0,0.22)] transition-colors duration-200 hover:bg-accent-hover"
        >
          {pkg.ctaLabel}
        </Link>
      </div>
    </div>
  )
}

export const PackageCard = memo(PackageCardComponent)
