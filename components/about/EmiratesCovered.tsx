'use client'

import { ButtonLink } from '@/components/ui/ButtonLink'
import { EMIRATE_ICON, type EmirateSlug } from '@/lib/emirate-icons'

const EMIRATES: readonly { slug: EmirateSlug; name: string }[] = [
  { slug: 'abu-dhabi', name: 'Abu Dhabi' },
  { slug: 'dubai', name: 'Dubai' },
  { slug: 'sharjah', name: 'Sharjah' },
  { slug: 'ajman', name: 'Ajman' },
  { slug: 'umm-al-quwain', name: 'Umm Al Quwain' },
  { slug: 'fujairah', name: 'Fujairah' },
  { slug: 'ras-al-khaimah', name: 'Ras Al Khaimah' },
] as const

export function EmiratesCovered() {
  return (
    <section className="bg-light-bg section-padding">
      <div className="container-wide">
        <div className="max-w-2xl">
          <h2 className="text-display-sm md:text-display-md font-bold text-light-text leading-tight">
            All Emirates Covered
          </h2>
          <p className="text-light-text-secondary text-base md:text-lg mt-4 leading-relaxed">
            We come to the vehicle, whether it is at a seller&apos;s home, showroom,
            office parking, or outdoor lot.
          </p>
        </div>

        <ul
          className="grid gap-3 sm:gap-4 mt-10 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7"
          aria-label="Emirates we cover"
        >
          {EMIRATES.map(({ slug, name }) => {
            const Icon = EMIRATE_ICON[slug]
            return (
              <li key={slug}>
                <div
                  className="
                    group flex flex-col items-center justify-center text-center
                    h-32 sm:h-36 px-3 py-4
                    rounded-card border border-light-border bg-light-card
                    text-light-text
                    hover:border-accent hover:text-accent
                    hover:shadow-[0_8px_24px_rgba(255,198,0,0.08)]
                    transition-all duration-200
                  "
                >
                  <Icon className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" aria-hidden="true" />
                  <span className="block font-bold text-xs sm:text-sm mt-3 leading-tight">
                    {name}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <ButtonLink href="/packages" size="lg" arrow>
            Book an Inspection in Your Emirate
          </ButtonLink>
          <p className="text-light-text-muted text-sm">
            Outside the main hubs? Add the location at booking and we&apos;ll confirm
            the soonest slot.
          </p>
        </div>
      </div>
    </section>
  )
}
