'use client'

import Link from 'next/link'
import { ArrowRight, Search, ShieldCheck, Wallet } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'

const REASONS = [
  {
    Icon: Search,
    title: 'Spot Hidden Issues',
    text: 'Accident history, frame damage, oil leaks, electrical faults: the things a test drive will never reveal.',
  },
  {
    Icon: ShieldCheck,
    title: 'Buy with Confidence',
    text: 'A clear, photo-backed report on every system in the car. Walk into the deal knowing exactly what you are getting.',
  },
  {
    Icon: Wallet,
    title: 'Save Money & Time',
    text: 'Catch expensive problems before they become yours. Negotiate harder or walk away. Both save you thousands.',
  },
]

export function WhyInspectionMatters() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section className="bg-background section-padding">
      <div ref={ref} className="reveal container-wide">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div>
            <h2 className="text-display-sm sm:text-display-md md:text-display-lg font-bold text-text-primary leading-tight">
              Why a Car Inspection Matters{' '}
              <span className="underline decoration-accent decoration-[3px] underline-offset-4">
                More Than You Think
              </span>
            </h2>
          </div>
          <p className="text-text-secondary text-base md:text-lg leading-relaxed lg:pt-6">
            A used car can look perfect at first glance, but appearances mislead. Hidden accident
            damage, engine wear, or odometer rollback can turn a promising deal into an expensive
            mistake. Our on-site inspection and same-day digital report give you the full picture
            before you sign anything.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
          {REASONS.map((reason) => (
            <div
              key={reason.title}
              className="bg-card border border-border rounded-card p-6 md:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)] transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-5">
                <reason.Icon className="text-background w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="text-text-primary font-bold text-lg">{reason.title}</h3>
              <p className="text-text-secondary text-sm mt-2 leading-relaxed">{reason.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/packages"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-primary hover:gap-2.5 transition-all duration-200"
          >
            Compare packages
            <ArrowRight className="w-4 h-4 text-accent" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
