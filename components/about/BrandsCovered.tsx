'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { BRANDS, type BrandPath } from '@/lib/brand-paths'

function BrandMark({ brand }: { brand: BrandPath }) {
  const [imgFailed, setImgFailed] = useState(false)

  if (brand.imageSrc && !imgFailed) {
    return (
      // Plain <img>: decorative brand logos with an onError → wordmark fallback
      // that next/image can't express; not an LCP element.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={brand.imageSrc}
        alt={`${brand.name} logo`}
        loading="lazy"
        onError={() => setImgFailed(true)}
        className={`h-7 sm:h-9 w-auto max-w-[80%] object-contain ${
          brand.imageFilter ?? '[filter:brightness(0)_invert(1)]'
        }`}
      />
    )
  }
  if (brand.path) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        role="img"
        aria-label={`${brand.name} logo`}
        className="h-7 sm:h-9 w-auto"
        style={brand.scale ? { transform: `scale(${brand.scale})` } : undefined}
      >
        <path d={brand.path} />
      </svg>
    )
  }
  return (
    <span className="font-bold tracking-[0.18em] text-sm sm:text-base uppercase">
      {brand.wordmark ?? brand.name}
    </span>
  )
}

export function BrandsCovered() {
  return (
    <section className="bg-surface section-padding">
      <div className="container-wide">
        <div className="max-w-2xl">
          <h2 className="text-display-sm md:text-display-md font-bold text-text-primary leading-tight">
            We Inspect Vehicles From These Brands{' '}
            <span className="text-accent">and More</span>
          </h2>
          <p className="text-text-secondary text-base md:text-lg mt-4 leading-relaxed">
            Our inspectors are experienced across every make sold in the UAE, from
            everyday Japanese saloons to German and British luxury and the full SUV
            and 4×4 lineup.
          </p>
        </div>

        <ul
          className="grid gap-3 mt-10 grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5"
          aria-label="Car brands we inspect"
        >
          {BRANDS.map((brand) => (
            <li key={brand.slug}>
              <a
                href={brand.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="
                  group relative flex items-center justify-center
                  h-20 sm:h-24 px-3
                  rounded-card border border-border bg-card
                  text-text-primary
                  hover:border-accent hover:bg-card-hover hover:text-accent
                  transition-colors duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
                "
                title={`Visit ${brand.name} UAE site`}
              >
                <BrandMark brand={brand} />
                <ExternalLink
                  className="absolute top-2 right-2 w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200"
                  aria-hidden="true"
                />
                <span className="sr-only">{brand.name} (opens UAE site in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>

        <p className="text-text-muted text-xs mt-6 max-w-2xl leading-relaxed">
          Brand names and logos are trademarks of their respective owners and are
          shown here solely to indicate the vehicles we inspect. Crescent Car Check
          is independent and is not affiliated with, endorsed by, or a partner of
          any vehicle manufacturer listed above.
        </p>
      </div>
    </section>
  )
}
