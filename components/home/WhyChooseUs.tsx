'use client'

import Image from 'next/image'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'

interface Feature {
  icon: string
  title: string
  text: string
  featured?: boolean
}

const FEATURES: Feature[] = [
  {
    icon: '/why-us/underbody.png',
    title: "Underbody Access Other Companies Can't Always Offer",
    text: 'Many inspection companies struggle to inspect low-clearance cars properly on-site. Our specialised low-approach ramps help us safely inspect underneath any car for leaks, scraping, damage and repair signs.',
    featured: true,
  },
  {
    icon: '/why-us/technology.png',
    title: 'Technology-Backed Reports',
    text: 'Our inspectors use a proprietary inspection app to record checks, photos and findings on-site. This helps us deliver consistent, detailed digital reports with a fast turnaround.',
  },
  {
    icon: '/why-us/independent.png',
    title: 'Independent Buyer-Focused Inspections',
    text: 'We work for you, not the seller. Our job is to give you an honest view of the car before you commit, without pressure or bias.',
  },
  {
    icon: '/why-us/uae-market.png',
    title: 'Built for the UAE Used-Car Market',
    text: 'We understand the risks buyers face in the UAE — resprayed panels, imported cars, accident repairs, heat-related wear, AC issues, weak batteries, worn tyres and cleared fault codes.',
  },
  {
    icon: '/why-us/evidence.png',
    title: 'Clear Evidence, Clear Recommendation',
    text: 'We back our findings with photos, readings and clear notes, so you understand exactly what we saw — along with a clear recommendation on whether to buy, negotiate or walk away.',
  },
  {
    icon: '/why-us/customer-service.png',
    title: 'Customer Service That Works Hard for You',
    text: 'Buying a used car can be stressful. We make the process simple, responsive and clear — from booking the inspection to helping you understand the findings.',
  },
]

function Squiggle() {
  return (
    <svg
      viewBox="0 0 80 24"
      className="mx-auto w-16 h-5 mb-3"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 12 H72"
        stroke="#FFC600"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function WhyChooseUs() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section id="about" className="bg-background section-padding">
      <div ref={ref} className="reveal container-wide">
        <div className="text-center mb-12 md:mb-16">
          <Squiggle />
          <h2 className="text-display-md md:text-display-lg font-bold text-text-primary">
            Why Choose Us?
          </h2>
          <span
            aria-hidden="true"
            className="block w-16 h-[3px] bg-accent rounded-full mx-auto mt-3"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 max-w-5xl mx-auto">
          {FEATURES.map(({ icon, title, text, featured }) => (
            <div
              key={title}
              className={cn(
                'relative bg-light-card rounded-card-lg p-7 md:p-8 hover:-translate-y-1 transition-transform duration-300',
                featured && 'border-2 border-accent shadow-[0_0_0_4px_rgba(255,198,0,0.12)]'
              )}
            >
              {featured && (
                <span className="absolute -top-3 left-7 md:left-8 inline-flex items-center bg-accent text-background text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                  Our Edge
                </span>
              )}
              <div className="mb-5">
                <Image
                  src={icon}
                  alt=""
                  width={64}
                  height={64}
                  className="w-14 h-14 md:w-16 md:h-16 object-contain"
                />
              </div>
              <h3 className="text-light-text font-bold text-lg md:text-xl leading-snug">
                {title}
              </h3>
              <p className="text-light-text-secondary text-sm md:text-base mt-3 leading-relaxed">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
