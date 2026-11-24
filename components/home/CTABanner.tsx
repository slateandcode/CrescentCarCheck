'use client'

import { Lock, FileText, MapPin } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { ButtonLink } from '@/components/ui/ButtonLink'

const MICRO = [
  { Icon: Lock, label: 'Secure Payment' },
  { Icon: FileText, label: 'Instant Reports' },
  { Icon: MapPin, label: 'All Emirates' },
]

export function CTABanner() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section className="bg-background section-padding relative overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-radial from-accent/5 via-transparent to-transparent pointer-events-none"
        aria-hidden="true"
      />
      <div ref={ref} className="reveal text-center container-narrow relative">
        <h2 className="text-display-md md:text-display-lg font-black text-text-primary">
          Ready to Inspect Your Next Car?
        </h2>
        <p className="text-text-secondary text-base md:text-lg mt-4 max-w-xl mx-auto">
          Book an on-site inspection anywhere in the UAE and get a full digital report
          the same day.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-4 mt-8">
          <ButtonLink href="/pricing/" size="lg" arrow fullWidth className="sm:w-auto">
            Book Inspection
          </ButtonLink>
          <ButtonLink href="/#contact" variant="outline" size="lg" fullWidth className="sm:w-auto">
            Contact Us
          </ButtonLink>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6">
          {MICRO.map(({ Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-text-secondary text-sm">
              <Icon className="w-4 h-4 text-accent" aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
