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
    <li className="flex items-start gap-1.5">
      {included ? (
        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" aria-hidden="true" />
      ) : (
        <X className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-error/70" aria-hidden="true" />
      )}
      <span
        className={cn(
          'text-[12.5px] leading-snug',
          included
            ? 'text-text-secondary'
            : 'text-text-muted line-through decoration-text-muted/50',
        )}
      >
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
        // Dark, elevated card on the light section — a deep shadow lifts it off
        // the page; the recommended tier carries the gold ring + glow.
        'group relative flex flex-col rounded-card-lg p-6 sm:p-8',
        'shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)]',
        'transition-transform duration-300 motion-safe:hover:-translate-y-1',
        isPremium
          ? 'bg-gradient-to-b from-[#221c0e] via-[#141414] to-[#0b0b0b] ring-2 ring-accent/60 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55),0_0_44px_rgba(255,198,0,0.10)]'
          : 'bg-gradient-to-b from-[#1d1d1d] to-[#0c0c0c] ring-1 ring-white/10',
      )}
    >
      {isPremium && (
        <span className="absolute right-6 top-0 -translate-y-1/2 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-background shadow-[0_4px_14px_rgba(255,198,0,0.4)]">
          Recommended
        </span>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-text-primary">{pkg.name} Inspection</h3>
          <p className="mt-1 text-sm text-text-secondary">{pkg.tagline}</p>
        </div>
        <div className="text-right">
          <p className="whitespace-nowrap text-3xl font-black leading-none tabular-nums text-accent">
            <span className="text-sm font-bold text-accent/70">AED </span>
            {pkg.price}
          </p>
          <p className="mt-1.5 text-[11px] font-medium text-text-muted">one-time</p>
        </div>
      </div>

      {/* Core checks — included in both packages (always ticked). */}
      <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-2">
        {pkg.coreFeatures.map((label) => (
          <FeatureItem key={label} label={label} included />
        ))}
      </ul>

      {/* Premium-only checks — ticked on Premium, crossed on Standard. */}
      <div className="my-5 border-t border-dashed border-white/10 pt-5">
        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">
          Premium-only checks
        </p>
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
          className={cn(
            'inline-flex w-full items-center justify-center rounded-button px-6 py-3.5 text-base transition-colors duration-200',
            isPremium
              ? 'bg-accent font-bold text-background shadow-[0_8px_24px_rgba(255,198,0,0.22)] hover:bg-accent-hover'
              : 'border border-white/20 font-semibold text-text-primary hover:border-white/40 hover:bg-white/5',
          )}
        >
          {pkg.ctaLabel}
        </Link>
      </div>
    </div>
  )
}

export const PackageCard = memo(PackageCardComponent)
