'use client'

import { useReveal } from '@/hooks/useReveal'
import { PackageCard } from '@/components/ui/PackageCard'
import { PaymentMethods } from '@/components/packages/PaymentMethods'
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
            Both packages include on-site inspection at the seller&apos;s location. No
            hidden fees. Instant report on completion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-4xl mx-auto items-stretch">
          {PACKAGES.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              linkHref={`/checkout?package=${pkg.id}`}
            />
          ))}
        </div>

        <p className="text-center text-light-text-muted text-sm mt-8">
          All prices inclusive of VAT. Payment secured by Stripe. No hidden fees.
        </p>
        <PaymentMethods />
      </div>
    </section>
  )
}
