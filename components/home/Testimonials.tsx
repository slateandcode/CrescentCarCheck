'use client'

import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'

interface Review {
  name: string
  location: string
  quote: string
  featured?: boolean
}

// TODO: replace with real testimonials once collected. Placeholder copy lifted
// from client brief V1 (page 10) — same names used in the mockup so client
// review matches what they signed off on.
const REVIEWS: Review[] = [
  {
    name: 'Ahmed Raza',
    location: 'Dubai, UAE',
    quote:
      "Crescent Car Check's inspection was incredibly thorough. They found hidden issues that weren't obvious during the test drive and saved me from a very expensive mistake.",
  },
  {
    name: 'Fatima Al Mansoori',
    location: 'Sharjah, UAE',
    featured: true,
    quote:
      'The report was super detailed and easy to understand. It gave me the confidence to negotiate a better price. Professional team, quick turnaround, and excellent service from start to finish.',
  },
  {
    name: 'Karim S.',
    location: 'Abu Dhabi, UAE',
    quote:
      'Booked an inspection on short notice and they delivered beyond expectations. The inspector was knowledgeable and the report was comprehensive. Highly recommend Crescent Car Check!',
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

function ReviewCard({ review }: { review: Review }) {
  return (
    <div
      className={cn(
        'rounded-card-lg p-7 md:p-8 flex flex-col h-full',
        review.featured
          ? 'bg-accent text-background'
          : 'bg-card text-text-primary border border-border'
      )}
    >
      <p
        className={cn(
          'text-base md:text-lg leading-relaxed italic',
          review.featured ? 'text-background' : 'text-text-primary'
        )}
      >
        &ldquo;{review.quote}&rdquo;
      </p>
      <div className="mt-auto pt-6">
        <p
          className={cn(
            'font-bold text-sm md:text-base',
            review.featured ? 'text-background' : 'text-text-primary'
          )}
        >
          - {review.name}
        </p>
        <p
          className={cn(
            'text-xs md:text-sm mt-0.5',
            review.featured ? 'text-background/80' : 'text-text-secondary'
          )}
        >
          {review.location}
        </p>
      </div>
    </div>
  )
}

export function Testimonials() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section className="bg-background section-padding">
      <div ref={ref} className="reveal container-wide">
        <div className="text-center mb-12 md:mb-16">
          <Squiggle />
          <h2 className="text-display-md md:text-display-lg font-bold text-text-primary">
            Client Testimonials
          </h2>
          <p className="text-text-secondary text-base md:text-lg mt-3 max-w-xl mx-auto">
            Hear from buyers who trusted Crescent Car Check before making their
            purchase.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto items-stretch">
          {REVIEWS.map((review) => (
            <ReviewCard key={review.name} review={review} />
          ))}
        </div>
      </div>
    </section>
  )
}
