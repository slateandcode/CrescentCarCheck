'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  Cog,
  Lightbulb,
  Disc3,
  Car,
  AppWindow,
  SprayCan,
  SlidersHorizontal,
  LifeBuoy,
} from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'

/**
 * The card uses an SVG viewBox of 200 × 100 (a 2:1 box). Every coordinate
 * below lives in that space, so the connector lines (SVG) and the
 * labels/dots (HTML, positioned by %) share one coordinate system.
 *
 * `car` — anchor point on the car silhouette.
 * `box` — centre of the floating label.
 * Array order is the reveal order: the index drives the staggered `--i`.
 */
const VIEW_W = 200
const VIEW_H = 100

const CALLOUTS = [
  { id: 'lights', label: 'Lights & Electrical', Icon: Lightbulb, car: [51, 55], box: [30, 11] },
  { id: 'engine', label: 'Engine & Mechanical', Icon: Cog, car: [54, 50], box: [30, 89] },
  { id: 'brakes', label: 'Brakes & ABS', Icon: Disc3, car: [63, 57], box: [78, 89] },
  { id: 'roof', label: 'Roof & Seals', Icon: Car, car: [101, 37], box: [78, 11] },
  { id: 'glass', label: 'Glass & Windows', Icon: AppWindow, car: [114, 44], box: [126, 11] },
  { id: 'paint', label: 'Paint & Bodywork', Icon: SprayCan, car: [107, 55], box: [126, 89] },
  { id: 'suspension', label: 'Suspension & Steering', Icon: SlidersHorizontal, car: [140, 53], box: [174, 11] },
  { id: 'tyres', label: 'Tyres & Wheels', Icon: LifeBuoy, car: [140, 68], box: [174, 89] },
] as const

/*
 * Below `sm` (640px) the card switches from a 2:1 box to a taller 3:2 / 4:3
 * one, but the SVG viewBox stays 2:1 (preserveAspectRatio="none"). That
 * vertically compresses where the car silhouette actually sits (it spans
 * ~21–60% of the card height instead of ~21–79%), so every anchor's fixed
 * `y` drifts below its intended feature. These mobile-only `car` coordinates
 * lift each anchor back onto the same relative point on the car. Only `y`
 * changes — the car's horizontal position is the same at every breakpoint.
 */
const MOBILE_CAR: Record<string, readonly [number, number]> = {
  lights: [51, 47],
  engine: [54, 43],
  brakes: [63, 45],
  roof: [101, 32],
  glass: [114, 36],
  paint: [107, 44],
  suspension: [140, 44],
  tyres: [140, 53],
}

/** viewBox coordinate → CSS percentage for HTML-positioned elements. */
const pctX = (x: number) => `${(x / VIEW_W) * 100}%`
const pctY = (y: number) => `${(y / VIEW_H) * 100}%`

type CssVars = React.CSSProperties & { '--i'?: number }

export function InspectionHighlights() {
  const headingRef = useReveal<HTMLDivElement>()
  const cardRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Track the sub-`sm` range where the card is taller than 2:1, so the
  // rear anchors can be lifted onto the car (see MOBILE_CAR).
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return
    const mq = matchMedia('(max-width: 639px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const callouts = CALLOUTS.map((c) =>
    isMobile && MOBILE_CAR[c.id] ? { ...c, car: MOBILE_CAR[c.id] } : c
  )

  // Trigger the draw-on animation only once the card is genuinely scrolled into
  // view. A dedicated observer (rather than useReveal) is used deliberately: the
  // useReveal hook reveals after a 1.2s safety timer regardless of scroll, which
  // would play this animation off-screen on page load. No JS fallback is needed
  // here because the hidden-state CSS is gated on `html.js-anim-ready`, so if JS
  // never runs the annotations simply stay visible.
  useEffect(() => {
    const el = cardRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed')
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="bg-light-bg section-padding !pb-10 sm:!pb-12 md:!pb-14 lg:!pb-16">
      <div className="container-wide">
        <div ref={headingRef} className="reveal text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <h2 className="text-display-sm md:text-display-md font-bold text-light-text">
            A Full Inspection, Inside and Out
          </h2>
          <p className="text-light-text-secondary leading-relaxed mt-4">
            Every major system, checked and documented — here&apos;s what we cover on
            each car, from the engine bay to the underbody.
          </p>
        </div>

        {/* Annotated car + (on phones) a legend — both draw on when scrolled into view */}
        <div ref={cardRef} className="annotated-card">
          <div className="hero-card relative w-full aspect-[4/3] xs:aspect-[3/2] sm:aspect-[2/1] rounded-card-lg border border-light-border bg-light-card overflow-hidden">
            <div className="hero-card-glow" aria-hidden="true" />

            {/* Car */}
            <div
              className="hero-car absolute aspect-[1900/828] z-10"
              style={{ left: '17%', width: '66%', top: '21.25%' }}
            >
              <Image
                src="/s-class.png"
                alt="Side profile of a luxury sedan undergoing a pre-purchase inspection"
                fill
                quality={95}
                sizes="(min-width: 1024px) 60vw, 80vw"
                className="object-contain"
              />
            </div>

            {/* Connector lines — viewBox matches the card's 2:1 ratio exactly */}
            <svg
              className="absolute inset-0 w-full h-full z-20"
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {callouts.map((c, i) => (
                <line
                  key={c.id}
                  className="hero-line"
                  x1={c.car[0]}
                  y1={c.car[1]}
                  x2={c.box[0]}
                  y2={c.box[1]}
                  pathLength={1}
                  style={{ '--i': i } as CssVars}
                />
              ))}
            </svg>

            {/* Anchor dots */}
            {callouts.map((c, i) => (
              <div
                key={c.id}
                className="hero-dot z-30"
                style={{ left: pctX(c.car[0]), top: pctY(c.car[1]), '--i': i } as CssVars}
                aria-hidden="true"
              />
            ))}

            {/* Floating labels (collapse to icon-only markers on a narrow card) */}
            {CALLOUTS.map((c, i) => (
              <div
                key={c.id}
                className="hero-callout z-40"
                style={{ left: pctX(c.box[0]), top: pctY(c.box[1]), '--i': i } as CssVars}
              >
                <span className="hero-callout-icon">
                  <c.Icon aria-hidden="true" />
                </span>
                <span className="hero-callout-label">{c.label}</span>
              </div>
            ))}
          </div>

          {/* Phone legend — the on-car labels are hidden on a small card, so the
              text is listed here instead. Each entry pops in with its marker. */}
          <ul className="annotated-legend min-[540px]:hidden mt-6 grid grid-cols-2 gap-x-4 gap-y-3">
            {CALLOUTS.map((c, i) => (
              <li
                key={c.id}
                className="hero-legend-item flex items-center gap-2.5"
                style={{ '--i': i } as CssVars}
              >
                <span className="w-8 h-8 rounded-lg bg-accent/10 grid place-items-center flex-shrink-0">
                  <c.Icon className="w-4 h-4 text-accent" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-light-text leading-tight">{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
