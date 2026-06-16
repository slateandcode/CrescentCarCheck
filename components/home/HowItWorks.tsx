'use client'

import { Package, Calendar, FileText } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'

const STEPS = [
  {
    num: '01',
    Icon: Package,
    title: 'Choose Your Package',
    description:
      'Browse our inspection tiers and pick the one that suits your needs and budget.',
  },
  {
    num: '02',
    Icon: Calendar,
    title: 'Book & Pay Online',
    description:
      "Pick your date and time window, share the car's exact location, and pay securely online. We come to you.",
  },
  {
    num: '03',
    Icon: FileText,
    title: 'Receive Your Report',
    description:
      'Your inspector completes the check and you receive a full digital report instantly.',
  },
]

export function HowItWorks() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section id="how-it-works" className="bg-light-bg section-padding relative scroll-mt-24">
      <div ref={ref} className="reveal container-wide relative">
        <div className="max-w-2xl">
          <h2 className="text-display-sm md:text-display-md font-bold text-light-text">
            Book Your Inspection in 3 Simple Steps
          </h2>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div
            className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] border-t-2 border-dashed border-light-border z-0"
            aria-hidden="true"
          />
          {STEPS.map((step) => (
            <div key={step.num} className="relative z-10">
              <span className="block text-7xl font-black text-light-border select-none leading-none" aria-hidden="true">
                {step.num}
              </span>
              <div className="w-14 h-14 rounded-2xl bg-accent-muted border border-accent/20 flex items-center justify-center mt-4">
                <step.Icon className="text-accent w-7 h-7" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-light-text mt-4">{step.title}</h3>
              <p className="text-light-text-secondary text-sm leading-relaxed mt-2">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
