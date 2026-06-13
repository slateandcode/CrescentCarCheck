'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { PackageCard } from '@/components/ui/PackageCard'
import { PACKAGES } from '@/lib/packages'

export function PackagesSection() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section className="bg-light-bg section-padding !pt-0">
      <div ref={ref} className="reveal container-wide">
        <div className="max-w-2xl">
          <h2 className="text-display-sm md:text-display-md font-bold text-light-text">
            Choose the right inspection package for you
          </h2>
          <p className="text-light-text-secondary text-base md:text-lg mt-3">
            All packages include on-site inspection at the seller&apos;s location. No
            hidden fees. Instant report on completion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 items-start">
          {PACKAGES.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              variant="compact"
              linkHref={`/checkout?package=${pkg.id}`}
            />
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            href="/checkout?package=comprehensive"
            className="inline-flex items-center gap-2 rounded-button border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-semibold text-light-text hover:bg-accent/15 hover:border-accent transition-colors duration-200"
          >
            <Sparkles className="w-4 h-4 text-accent flex-shrink-0" aria-hidden="true" />
            <span>
              Not sure?{' '}
              <span className="text-accent">Most buyers choose Comprehensive</span>
            </span>
            <ArrowRight className="w-4 h-4 text-accent flex-shrink-0" aria-hidden="true" />
          </Link>

          <Link
            href="/packages"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-light-text-secondary hover:text-light-text hover:gap-2.5 transition-all duration-200"
          >
            Or compare all packages in detail
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        <p className="text-center text-light-text-muted text-sm mt-6">
          All prices inclusive of VAT. Payment secured by Stripe.
        </p>
      </div>
    </section>
  )
}
