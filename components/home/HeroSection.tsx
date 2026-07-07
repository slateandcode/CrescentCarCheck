'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Phone, X, Crown } from 'lucide-react'
import { WhatsAppGlyph } from '@/components/layout/SocialIcons'
import { cn, telHref } from '@/lib/utils'
import { trackEvent, GA_EVENTS } from '@/lib/analytics'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '971502526314'
const PHONE = process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+971 502526314'
const WA_MESSAGE =
  "Hi Crescent Car Check, I'd like to book a pre-purchase car inspection."

const WA_HREF = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(WA_MESSAGE)}`

type Slide = {
  id: string
  image: string
  alt: string
  title: string
  highlight: string
  body: string
  /** object-position focal point so object-cover keeps the subject in frame. */
  focus: string
}

/** The three hero slides, mirroring the client's brief (Van / Endoscopic / Tablet). */
const SLIDES: Slide[] = [
  {
    id: 'mobile-inspection',
    image: '/Van.png',
    alt: 'Crescent Car Check mobile inspection van',
    title: "Book the UAE's Best Pre-Purchase Car Inspection",
    highlight: 'Available in Every Emirate',
    body: "Know what you're buying before you commit. Our mobile team checks the car on-site and creates a detailed digital report, helping you avoid hidden problems, costly repairs and bad buys.",
    focus: '100% 60%',
  },
  {
    id: 'endoscopic',
    image: '/Endoscopic.png',
    alt: 'Crescent inspector using an endoscopic camera under a car',
    title: 'Endoscopic Camera Checks for Hidden Issues',
    highlight: "We Look Where Other Companies Don't",
    body: 'We are the only mobile car inspection company in the UAE that uses an endoscopic camera to inspect hidden areas, helping uncover leaks, damage, poor repairs and more.',
    focus: '20% 55%',
  },
  {
    id: 'digital-report',
    image: '/Tablet.png',
    alt: 'Crescent inspector reviewing a digital inspection report on a tablet',
    title: 'Fast Digital Reports, Built While We Inspect',
    highlight: 'Powered by proprietary inspection software',
    body: 'Our software ensures nothing is missed by guiding every check, scoring each key area, and generating a clear report with photos, issue notes and a Buy, Negotiate or Avoid recommendation.',
    // Top-anchored: his cap touches the top of the photo, so any vertical
    // crop must come off the bottom (shirt) rather than his head.
    focus: '100% 0%',
  },
]

const AUTOPLAY_MS = 6500

/** Shared CTA stack: WhatsApp (with the real WhatsApp logo), Call Now, online checkout. */
function SlideCtas() {
  return (
    <div className="mt-5 sm:mt-6 space-y-3">
      <a
        href={WA_HREF}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent(GA_EVENTS.WHATSAPP_CLICK, { source: 'hero' })}
        className="flex w-full items-center justify-center gap-2.5 rounded-button bg-accent px-6 py-3.5 text-base font-bold text-[#0A0A0A] shadow-[0_8px_24px_rgba(255,198,0,0.28)] transition-colors hover:bg-accent-hover"
      >
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#25D366]">
          <WhatsAppGlyph className="h-3.5 w-3.5 text-white" />
        </span>
        Book on WhatsApp
      </a>

      <a
        href={telHref(PHONE)}
        onClick={() => trackEvent(GA_EVENTS.PHONE_CLICK, { source: 'hero' })}
        className="flex w-full items-center justify-center gap-2.5 rounded-button border border-[#0A0A0A]/20 bg-white/70 px-6 py-3.5 text-base font-bold text-[#0A0A0A] transition-colors hover:border-[#0A0A0A]/40 hover:bg-white"
      >
        <Phone className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        Call Now
      </a>

      <div className="text-center">
        <Link
          href="/packages"
          className="text-sm font-medium text-[#0A0A0A]/70 underline decoration-[#0A0A0A]/30 underline-offset-2 transition-colors hover:text-[#0A0A0A]"
        >
          Prefer online checkout? Book &amp; Pay Online
        </Link>
      </div>
    </div>
  )
}

/** Floating, pulsating price teaser. Whole card links to /packages; the X dismisses it. */
function PriceTeaser({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="hero-price-card pointer-events-auto absolute bottom-11 right-3 z-20 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8">
      <div className="relative">
        <Link
          href="/packages"
          onClick={() => trackEvent(GA_EVENTS.VIEW_PACKAGES, { source: 'hero_teaser' })}
          aria-label="View inspection packages: Standard AED 299, Premium AED 399"
          className="flex items-stretch gap-2 rounded-2xl bg-white p-2 shadow-[0_12px_36px_rgba(0,0,0,0.22)] ring-1 ring-black/5"
        >
          {/* Standard tile */}
          <div className="flex flex-col justify-center rounded-xl bg-[#F1F1F2] px-3.5 py-2.5">
            <span className="w-fit rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-[#0A0A0A]/70">
              Standard
            </span>
            <span className="mt-1 text-lg font-black leading-none text-[#0A0A0A]">
              <span className="text-[11px] font-bold text-[#0A0A0A]/60">AED </span>
              299
            </span>
          </div>

          {/* Premium tile */}
          <div className="flex flex-col justify-center rounded-xl bg-[#0A0A0A] px-3.5 py-2.5">
            <span className="flex w-fit items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-[#0A0A0A]">
              Premium
              <Crown className="h-3 w-3" aria-hidden="true" />
            </span>
            <span className="mt-1 text-lg font-black leading-none text-white">
              <span className="text-[11px] font-bold text-white/60">AED </span>
              399
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss pricing"
          className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#0A0A0A] text-white shadow-md transition-transform hover:scale-105"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export function HeroSection() {
  const [active, setActive] = useState(0)
  const [teaserOpen, setTeaserOpen] = useState(true)
  const paused = useRef(false)
  const touchStartX = useRef<number | null>(null)

  const goTo = useCallback((i: number) => {
    setActive(((i % SLIDES.length) + SLIDES.length) % SLIDES.length)
  }, [])
  const next = useCallback(() => goTo(active + 1), [active, goTo])
  const prev = useCallback(() => goTo(active - 1), [active, goTo])

  // Autoplay — pauses on hover/focus and honours reduced-motion.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      if (mq.matches) return
    }
    const id = window.setInterval(() => {
      if (!paused.current) setActive((a) => (a + 1) % SLIDES.length)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 45) (dx < 0 ? next : prev)()
    touchStartX.current = null
  }

  return (
    <section className="bg-background pt-20 md:pt-24" aria-label="Featured inspection services">
      {/* Full-bleed light panel (no side frame). Slide content inside is capped to
          the site container so it doesn't stretch on wide screens. bg matches the
          studio backdrop of the slide photos (~#F7F7F8) so the image dissolves into
          the panel with no visible seam. */}
      <div
        className="relative overflow-hidden bg-[#F7F7F8]"
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
        onFocusCapture={() => (paused.current = true)}
        onBlurCapture={() => (paused.current = false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
          {/* Slide track — all slides mounted, translated horizontally. */}
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {SLIDES.map((slide, i) => (
              <div
                key={slide.id}
                className="w-full flex-shrink-0"
                aria-hidden={i !== active}
              >
                {/* Content tracks the same container as the navbar (max-w-7xl) so the
                    heading aligns with the logo and nothing stretches on wide screens.
                    The text column is capped; the photo takes the rest. */}
                <div className="mx-auto grid min-h-[32rem] w-full max-w-7xl px-4 sm:px-6 lg:min-h-[34rem] lg:grid-cols-[minmax(0,30rem)_1fr] lg:gap-8 lg:px-8">
                  {/* lg:pl-6 keeps the copy clear of the prev-arrow gutter. */}
                  <div className="order-1 flex flex-col justify-center pt-8 pb-4 lg:py-12 lg:pl-6">
                    <h1 className="text-2xl font-black leading-[1.12] text-[#0A0A0A] sm:text-4xl xl:text-5xl">
                      {slide.title}
                    </h1>
                    <p className="mt-2.5 text-base font-semibold text-[#C98A00] sm:mt-3 sm:text-lg">
                      {slide.highlight}
                    </p>
                    <p className="mt-2.5 max-w-md text-sm leading-relaxed text-[#0A0A0A]/70 sm:text-[15px]">
                      {slide.body}
                    </p>
                    <SlideCtas />
                  </div>

                  {/* Image — full-bleed on mobile (negative margins cancel the container
                      padding). On desktop the right margin is pulled negative all the way
                      to the viewport edge so the photo bleeds offscreen like the client
                      mock — no hard crop line inside the panel. The photos share the
                      panel's studio-white backdrop, so the remaining edges blend invisibly. */}
                  <div className="relative order-2 -mx-4 min-h-[260px] sm:-mx-6 sm:min-h-[340px] lg:ml-0 lg:min-h-0 lg:mr-[min(-2rem,calc((80rem-100vw)/2-2rem))]">
                    <Image
                      src={slide.image}
                      alt={slide.alt}
                      fill
                      priority={i === 0}
                      quality={90}
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-cover"
                      style={{ objectPosition: slide.focus }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Arrows sit at the panel's outer edges, like the client mock. */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-2 top-[71%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0A0A0A] shadow-md ring-1 ring-black/5 transition-colors hover:bg-white lg:left-4 lg:top-1/2 lg:h-11 lg:w-11"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-2 top-[71%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0A0A0A] shadow-md ring-1 ring-black/5 transition-colors hover:bg-white lg:right-4 lg:top-1/2 lg:h-11 lg:w-11"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Teaser tracks the content container so it stays under the vehicle. */}
          <div className="pointer-events-none absolute inset-0 z-20 mx-auto max-w-7xl">
            {teaserOpen && <PriceTeaser onDismiss={() => setTeaserOpen(false)} />}
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2 lg:bottom-5">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active ? 'true' : undefined}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  i === active ? 'w-6 bg-[#0A0A0A]' : 'w-2 bg-[#0A0A0A]/25 hover:bg-[#0A0A0A]/40',
                )}
              />
            ))}
          </div>
        </div>
    </section>
  )
}
