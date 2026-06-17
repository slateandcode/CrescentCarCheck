'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Play,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'
import { INSPECTED_CARS, type InspectedCar, type Recommendation } from '@/lib/inspected-cars'
import { InspectionVideoModal } from './InspectionVideoModal'

const REC_STYLES: Record<
  Recommendation,
  { label: string; text: string; Icon: typeof CheckCircle2 }
> = {
  buy: { label: 'Buy', text: 'text-success', Icon: CheckCircle2 },
  negotiate: { label: 'Negotiate', text: 'text-warning', Icon: AlertCircle },
  avoid: { label: 'Avoid', text: 'text-error', Icon: AlertTriangle },
}

function Squiggle() {
  return (
    <svg viewBox="0 0 80 24" className="mx-auto w-16 h-5 mb-3" fill="none" aria-hidden="true">
      <path
        d="M8 12 H72"
        stroke="#FFC600"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

const CARD_WIDTH = 'w-[78vw] xs:w-[62vw] sm:w-[48vw] md:w-[32vw] lg:w-[18.5%]'

function CarCard({ car, onPlay }: { car: InspectedCar; onPlay: (car: InspectedCar) => void }) {
  const hasVideo = Boolean(car.video)
  const rec = REC_STYLES[car.recommendation]

  const inner = (
    <>
      <div className="relative aspect-square bg-surface overflow-hidden">
        {/* Fixed-aspect square frame: every thumbnail renders at an identical
            size regardless of any source-image quirk, with object-cover cropping
            to fill. This keeps the mobile carousel uniform (the source PNGs are
            1:1, so nothing is actually cropped). */}
        <Image
          src={car.image}
          alt={`${car.make} ${car.model}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 78vw, (max-width: 1024px) 32vw, 18vw"
        />

        {hasVideo ? (
          <>
            {/* Dim overlay so the play affordance reads on light photos */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors duration-300"
            />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white">
              <Play className="w-3 h-3 fill-accent text-accent" aria-hidden="true" />
              Watch Inspection
            </span>
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
              <span className="w-14 h-14 rounded-full bg-accent text-background flex items-center justify-center shadow-glow transition-transform duration-300 group-hover:scale-110">
                <Play className="w-6 h-6 fill-current translate-x-0.5" />
              </span>
            </span>
          </>
        ) : (
          <span className="absolute left-3 top-3 rounded-full bg-card/80 backdrop-blur-sm px-3 py-1 text-xs font-medium text-text-secondary">
            Video coming soon
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col gap-5">
        <h3 className="font-bold text-lg md:text-xl leading-snug text-text-primary min-h-[3rem] md:min-h-[3.5rem]">
          {car.make} {car.model}
        </h3>

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2.5 text-sm">
            <ShieldCheck className="w-4 h-4 mt-0.5 text-accent flex-shrink-0" aria-hidden="true" />
            <span className="text-text-secondary">
              Crescent Score:{' '}
              <span className="font-bold text-accent">{car.crescentScore}%</span>
            </span>
          </div>

          <div className="h-px bg-border" aria-hidden="true" />

          <div className="flex items-start gap-2.5 text-sm">
            <rec.Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', rec.text)} aria-hidden="true" />
            <span className="text-text-secondary">
              Recommendation:{' '}
              <span className={cn('font-bold', rec.text)}>{rec.label}</span>
            </span>
          </div>
        </div>

        {car.finding && (
          <p className="text-xs text-text-secondary leading-relaxed">{car.finding}</p>
        )}
      </div>
    </>
  )

  const cardClasses = cn(
    'group snap-start flex-shrink-0 rounded-card-lg overflow-hidden flex flex-col text-left',
    CARD_WIDTH,
    'bg-card border border-border transition-all duration-300 hover:-translate-y-1 hover:border-accent/60',
    'shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_42px_rgba(0,0,0,0.6)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
  )

  if (hasVideo) {
    return (
      <button
        type="button"
        onClick={() => onPlay(car)}
        aria-label={`Watch the ${car.make} ${car.model} inspection video`}
        className={cardClasses}
      >
        {inner}
      </button>
    )
  }

  return <div className={cardClasses}>{inner}</div>
}

export function RecentlyInspected() {
  const ref = useReveal<HTMLDivElement>()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [activeCar, setActiveCar] = useState<InspectedCar | null>(null)

  const scrollToIndex = (index: number) => {
    const el = scrollerRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(index, INSPECTED_CARS.length - 1))
    const child = el.children[clamped] as HTMLElement | undefined
    if (child) el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' })
  }

  const onScroll = () => {
    const el = scrollerRef.current
    if (!el) return
    const children = Array.from(el.children) as HTMLElement[]
    let nearest = 0
    let min = Infinity
    children.forEach((child, i) => {
      const dist = Math.abs(child.offsetLeft - el.scrollLeft)
      if (dist < min) {
        min = dist
        nearest = i
      }
    })
    setActive(nearest)
  }

  return (
    <section id="recently-inspected" className="bg-background section-padding scroll-mt-24">
      <div ref={ref} className="reveal container-wide">
        <div className="text-center mb-10 md:mb-14">
          <Squiggle />
          <h2 className="text-display-md md:text-display-lg font-bold text-text-primary">
            Recently Inspected Cars
          </h2>
          <p className="text-text-secondary text-base md:text-lg mt-3 max-w-xl mx-auto">
            Real cars. Real findings. Tap any vehicle to watch the inspection video.
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => scrollToIndex(active - 1)}
            aria-label="Previous cars"
            className="hidden md:flex absolute -left-2 lg:-left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 lg:w-12 lg:h-12 items-center justify-center rounded-full bg-card border border-border text-text-primary shadow-sm hover:bg-card-hover hover:border-border-hover transition-colors"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(active + 1)}
            aria-label="Next cars"
            className="hidden md:flex absolute -right-2 lg:-right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 lg:w-12 lg:h-12 items-center justify-center rounded-full bg-card border border-border text-text-primary shadow-sm hover:bg-card-hover hover:border-border-hover transition-colors"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>

          <div
            ref={scrollerRef}
            onScroll={onScroll}
            className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 md:mx-0 px-4 md:px-0 pb-2"
          >
            {INSPECTED_CARS.map((car) => (
              <CarCard key={car.slug} car={car} onPlay={setActiveCar} />
            ))}
          </div>
        </div>

        <div className="mt-7 flex justify-center gap-2">
          {INSPECTED_CARS.map((car, i) => (
            <button
              key={car.slug}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to ${car.make} ${car.model}`}
              aria-current={i === active ? 'true' : undefined}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === active ? 'w-6 bg-accent' : 'w-2 bg-border hover:bg-border-hover'
              )}
            />
          ))}
        </div>
      </div>

      <InspectionVideoModal car={activeCar} onClose={() => setActiveCar(null)} />
    </section>
  )
}
