'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Phone, X, Crown } from 'lucide-react'
import { WhatsAppGlyph } from '@/components/layout/SocialIcons'
import { cn, telHref } from '@/lib/utils'
import { trackEvent, GA_EVENTS } from '@/lib/analytics'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '971588425010'
const PHONE = process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+971 58 842 5010'
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
  /** Mobile/tablet photo-slot heights. The portrait tablet render is height-tight
      in the slot, so it alone gets a taller slot to render bigger; the landscape
      slides are width-tight and would only gain empty air from extra height.
      The landscape slides' aspect locks end at lg (lg:aspect-auto): stretched to
      the desktop band's height they'd force the slot wider than its grid column,
      blowing the image past the panel edge — unlocked, it fits the column. */
  photoSlot: string
  /** Desktop copy-column width. The photo takes the rest of the band, so a slide
      with short copy (endoscopic) trades column for photo — its landscape image is
      width-tight at lg+, and every pixel of column becomes visible vehicle. */
  desktopCols: string
  /** Inset of the image box inside its (overflow-hidden) slot. A negative bottom
      oversizes the image past the panel's bottom border so a baked-in bottom fade
      is clipped away — the subject ends solid at the frame, cut by the border. */
  photoInset: string
}

/** The three hero slides, mirroring the client's brief (Van / Endoscopic / Tablet).
    All three PNGs are transparent cutouts whose edges fade to alpha 0, so they can
    be contained and anchored anywhere without a hard edge ever showing. */
const SLIDES: Slide[] = [
  {
    id: 'mobile-inspection',
    image: '/Van.png',
    alt: 'Crescent Car Check mobile inspection van',
    title: "Book the UAE's Best Pre-Purchase Car Inspection",
    highlight: 'Available in Every Emirate',
    body: "Know what you're buying before you commit. Our mobile team checks the car on-site and creates a detailed digital report, helping you avoid hidden problems, costly repairs and bad buys.",
    // Slot aspect == image aspect, so object-contain fills it exactly edge to
    // edge at every mobile width — no letterbox gaps at the panel's sides.
    // lg drops the lock: left active, the height-stretched slot would force
    // width = 800px × aspect ≈ 1490px, overflowing its ~1100px column and
    // clipping the van's front past the panel edge. Unlocked, the slot is the
    // column and the contained van renders width-tight — whole van, smaller.
    photoSlot: 'aspect-[1126/605] lg:aspect-auto',
    desktopCols: 'lg:grid-cols-[minmax(0,28rem)_1fr] xl:grid-cols-[minmax(0,34rem)_1fr]',
    // lg/2xl bottom raise: the width-tight van renders shorter than the
    // endoscopic scene, so grounded on the panel border it sat visibly lower
    // than the Audi. Lifting its box bottom puts the two roofs on the same line
    // slide to slide (client feedback 2026-07-12) — a bigger lift at 2xl because
    // the height gap between the two renders grows with the photo column.
    // Mobile keeps it grounded at inset-0.
    photoInset: 'inset-0 lg:bottom-24 2xl:bottom-32',
  },
  {
    id: 'endoscopic',
    image: '/hero-endoscopic2.png',
    alt: 'Crescent inspector using an endoscopic camera under a car',
    title: 'Endoscopic Camera Checks for Hidden Issues',
    highlight: "We Look Where Other Companies Don't",
    body: 'We are the only mobile car inspection company in the UAE that uses an endoscopic camera to inspect hidden areas, helping uncover leaks, damage, poor repairs and more.',
    // Slot aspect == image aspect: fills edge to edge, no side gaps on mobile.
    // lg unlocks the aspect for the same reason as the van slide: the stretched
    // slot would otherwise oversize ~25% past its column and the panel edge.
    photoSlot: 'aspect-[1656/918] lg:aspect-auto',
    // Narrower column than the others: this slide's copy is the shortest, and its
    // width-tight landscape scene grows by every rem the column gives up.
    desktopCols: 'lg:grid-cols-[minmax(0,24rem)_1fr] xl:grid-cols-[minmax(0,29rem)_1fr]',
    // The PNG's inspector fades to alpha ~60px before its right edge (he was cut
    // in the source photo), so a tight box would show him ghosting out mid-panel.
    // Below lg: matching -right/-bottom percentages keep the box at the image's
    // aspect, so contain fills it and the scene renders 10% bigger, pushing the
    // fade past the slot — the panel edge cuts him solid, framed not ghosted.
    // Only his leg corner lives in the bottom strip, so the bottom overhang clips
    // nothing else. At lg the image is width-tight, so a right-only overhang is
    // enough (5% ≈ 60px ≥ the scaled fade) and bottom-0 keeps him grounded on
    // the panel's bottom border.
    photoInset: 'left-0 top-0 -right-[10%] -bottom-[10%] lg:-right-[5%] lg:bottom-0',
  },
  {
    id: 'digital-report',
    image: '/hero-tablet2.png',
    alt: 'Crescent inspector reviewing a digital inspection report on a tablet',
    title: 'Fast Digital Reports, Built While We Inspect',
    // No "inspection": it wrapped the highlight to two lines on mobile, pushing
    // this slide's WhatsApp button out of line with the other slides' (client
    // feedback 2026-07-12 — must read as one line).
    highlight: 'Powered by proprietary software',
    body: 'Our software ensures nothing is missed by guiding every check, scoring each key area, and generating a clear report with photos, issue notes and a Buy, Negotiate or Avoid recommendation.',
    // Aspect-locked like the landscape slides (16/9 sits between their 1.86 and
    // 1.80), so all three slides' natural heights match at every mobile width.
    // The old taller fixed-height slot stretched the track, and the slack landed
    // as blank space between the other slides' CTA and photo (client feedback
    // 2026-07-12: shorten the mobile image block). lg unlocks for self-stretch
    // like the others.
    photoSlot: 'aspect-[16/9] lg:aspect-auto',
    desktopCols: 'lg:grid-cols-[minmax(0,28rem)_1fr] xl:grid-cols-[minmax(0,34rem)_1fr]',
    // Oversize past the slot bottom so the portrait render is CROPPED below the
    // hands (client's mobile crop) instead of shrunk to the short slot — and the
    // baked 230px waist fade is clipped away, the man ending solid at the
    // carousel's lower edge. Desktop is unchanged: hangs 10rem below the panel
    // border; the lg top inset shrinks the height-tight render ~11% so he sits
    // in scale with the (also scaled-down) car slides instead of filling the band.
    photoInset: 'inset-x-0 top-0 -bottom-32 sm:-bottom-44 lg:top-24 lg:-bottom-40',
  },
]

// Brief item 7: 8s per slide, and the timer restarts after any manual interaction.
const AUTOPLAY_MS = 8000

function WhatsAppCta({
  isActive,
  ctaRef,
}: {
  isActive: boolean
  ctaRef?: (el: HTMLAnchorElement | null) => void
}) {
  return (
    <a
      ref={ctaRef}
      href={WA_HREF}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={isActive ? undefined : -1}
      onClick={() => trackEvent(GA_EVENTS.WHATSAPP_CLICK, { source: 'hero' })}
      className="flex w-full items-center justify-center gap-2.5 rounded-button bg-accent px-6 py-3.5 text-base font-bold text-[#0A0A0A] shadow-[0_8px_24px_rgba(255,198,0,0.28)] transition-colors hover:bg-accent-hover"
    >
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#25D366]">
        <WhatsAppGlyph className="h-3.5 w-3.5 text-white" />
      </span>
      Book on WhatsApp
    </a>
  )
}

/** Call Now + online checkout. Rendered inside each slide's copy column on desktop,
    and once (statically) under the carousel on mobile — brief item 2's ordering. */
function SecondaryCtas({ isActive = true }: { isActive?: boolean }) {
  return (
    <div className="space-y-3">
      <a
        href={telHref(PHONE)}
        tabIndex={isActive ? undefined : -1}
        onClick={() => trackEvent(GA_EVENTS.PHONE_CLICK, { source: 'hero' })}
        className="flex w-full items-center justify-center gap-2.5 rounded-button border border-[#0A0A0A]/20 bg-white/70 px-6 py-3.5 text-base font-bold text-[#0A0A0A] transition-colors hover:border-[#0A0A0A]/40 hover:bg-white"
      >
        <Phone className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        Call Now
      </a>

      <div className="text-center">
        <Link
          href="/packages"
          tabIndex={isActive ? undefined : -1}
          className="text-sm font-medium text-[#0A0A0A]/70 underline decoration-[#0A0A0A]/30 underline-offset-2 transition-colors hover:text-[#0A0A0A]"
        >
          Prefer online checkout? Book &amp; Pay Online
        </Link>
      </div>
    </div>
  )
}

/** The teaser's inner card — pricing tiles that link to /packages, plus the X.
    Shared by the desktop (in-hero) and mobile (fixed) placements. */
function TeaserCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="relative">
      <Link
        href="/packages"
        onClick={() => trackEvent(GA_EVENTS.VIEW_PACKAGES, { source: 'hero_teaser' })}
        aria-label="View inspection packages: Standard AED 299, Premium AED 399"
        className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.22)] ring-1 ring-black/5"
      >
        {/* Standard tile — grid-cols-2 keeps both tiles the same width (brief: symmetry) */}
        <div className="flex min-w-[7.75rem] flex-col justify-center rounded-xl bg-[#F1F1F2] px-4 py-3">
          <span className="w-fit rounded-full bg-black/5 px-2.5 py-0.5 text-[11px] font-semibold text-[#0A0A0A]/70">
            Standard
          </span>
          <span className="mt-1.5 text-2xl font-black leading-none text-[#0A0A0A]">
            <span className="text-xs font-bold text-[#0A0A0A]/60">AED </span>
            299
          </span>
        </div>

        {/* Premium tile */}
        <div className="flex min-w-[7.75rem] flex-col justify-center rounded-xl bg-[#0A0A0A] px-4 py-3">
          <span className="flex w-fit items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-[#0A0A0A]">
            Premium
            <Crown className="h-3 w-3" aria-hidden="true" />
          </span>
          <span className="mt-1.5 text-2xl font-black leading-none text-white">
            <span className="text-xs font-bold text-white/60">AED </span>
            399
          </span>
        </div>
      </Link>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss pricing"
        className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#0A0A0A] text-white shadow-md transition-transform hover:scale-105"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

/** The pricing teaser, fixed to the viewport bottom-right and only shown after the
    hero WhatsApp button scrolls up to the navbar (brief item 4) — every width, so
    desktop behaves like phone: floating WhatsApp/phone pills until the customer
    scrolls, then the teaser covers them (body.price-teaser-open). */
function PriceTeaserFixed({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="hero-price-card fixed right-4 z-40 sm:right-6"
      style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <TeaserCard onDismiss={onDismiss} />
    </div>
  )
}

export function HeroSection() {
  const [active, setActive] = useState(0)
  const [pastTrigger, setPastTrigger] = useState(false)
  const [teaserDismissed, setTeaserDismissed] = useState(false)
  const paused = useRef(false)
  const touchStartX = useRef<number | null>(null)
  const heroWaBtn = useRef<HTMLAnchorElement | null>(null)

  const goTo = useCallback((i: number) => {
    setActive(((i % SLIDES.length) + SLIDES.length) % SLIDES.length)
  }, [])
  const next = useCallback(() => goTo(active + 1), [active, goTo])
  const prev = useCallback(() => goTo(active - 1), [active, goTo])

  // Autoplay — depends on `active` so ANY slide change (auto or manual swipe/arrow/
  // dot) restarts the full 8s window; the carousel never advances right after a
  // manual interaction (brief item 7). Pauses on hover/focus, honours reduced-motion.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return
    const id = window.setInterval(() => {
      if (!paused.current) setActive((a) => (a + 1) % SLIDES.length)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [active])

  // Teaser trigger (brief item 4): show the pricing card once the hero WhatsApp
  // button has scrolled up to touch the fixed navbar; hide it again above that
  // point. All slides share the same vertical layout, so slide 0's button works
  // as the sentinel regardless of which slide is active.
  useEffect(() => {
    const header = document.querySelector('header')
    // No rAF throttle: scroll events are already coalesced per frame, and the
    // check is just two getBoundingClientRect calls.
    const check = () => {
      const btn = heroWaBtn.current
      if (!btn) return
      const navBottom = header ? header.getBoundingClientRect().bottom : 72
      setPastTrigger(btn.getBoundingClientRect().top <= navBottom)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  const teaserVisible = pastTrigger && !teaserDismissed

  // While the teaser is pinned it replaces the floating WhatsApp/phone buttons;
  // dismissing it (X) brings them back — see body.price-teaser-open in globals.css.
  useEffect(() => {
    document.body.classList.toggle('price-teaser-open', teaserVisible)
    return () => document.body.classList.remove('price-teaser-open')
  }, [teaserVisible])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 45) (dx < 0 ? next : prev)()
    touchStartX.current = null
  }

  const dots = (
    <>
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
    </>
  )

  // Bottom spacing lives as section PADDING, not panel margin: a margin would
  // collapse through the section's bottom edge and the gap under the panel would
  // paint the page's black body background — a black bar that swallows the
  // panel's bottom border (and the dark-shirted tablet inspector's cut).
  // lg:px-6 is the panel's side gutter (its own lg margins became mx-auto — see
  // the max-width note on the panel).
  return (
    <section
      className="bg-white pb-3 pt-16 sm:pb-4 md:pt-[4.5rem] lg:px-6 lg:pb-6"
      aria-label="Featured inspection services"
    >
      {/* The carousel lives inside a big rounded panel floating on the white page
          (the checkmycar treatment): the panel's border is what "cuts" the photos,
          so subjects grounded on its bottom edge read as intentionally framed. The
          slide PNGs are transparent, so they sit straight on the panel backdrop
          with no seam (brief item 8), contained, never crop-fitted (brief item 6). */}
      {/* max-w-[120rem]: the band's height (≤50rem) and copy column (rem-capped)
          don't grow with the viewport, so past ~1920px (4K, browser zoomed out)
          an uncapped panel degenerates into a squat strip with the photo afloat
          in gray void. Capping the PANEL keeps the hero one proportioned block,
          centered like every other section (brief item 6's zoom-out complaint) —
          and the panel edge keeps doing the photo cutting, so the framing tricks
          are unchanged. Below the cap nothing changes: full-bleed on ≤1920px
          screens (memory: no visible capping on Fahad's 1706px PC). */}
      <div
        className="relative mx-3 mt-3 overflow-hidden rounded-[1.75rem] bg-[#F7F7F8] sm:mx-4 sm:mt-4 lg:mx-auto lg:mt-6 lg:max-w-[120rem] lg:rounded-[2.75rem]"
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
        onFocusCapture={() => (paused.current = true)}
        onBlurCapture={() => (paused.current = false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Slide track — all slides mounted, translated horizontally (the brief's
            sliding carousel). Safe now that the PNGs' cut edges are feathered: a
            slide edge crossing mid-screen during the 500ms transition shows a soft
            dissolve, never a razor line. */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {SLIDES.map((slide, i) => {
            const isActive = i === active
            // overflow-hidden: the photo slot bleeds to this slide's own edge;
            // clipping here guarantees it can never paint into a neighbour.
            return (
              <div key={slide.id} className="relative w-full flex-shrink-0 overflow-hidden" aria-hidden={!isActive}>
                {/* Decorative flow — a white wave low across the gray plus faint
                    gold glows. It lives INSIDE each slide so the background
                    translates with the swipe instead of sitting still behind it.
                    Pure backdrop — never intercepts input; the band container
                    below is `relative` so all content paints above it. */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 1440 640"
                    preserveAspectRatio="none"
                    fill="none"
                  >
                    <path
                      d="M0 640 L0 360 C 300 220 560 500 900 360 C 1140 262 1300 320 1440 240 L1440 640 Z"
                      fill="#FFFFFF"
                      opacity="0.85"
                    />
                  </svg>
                  <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#FFC600]/10 blur-3xl" />
                  <div className="absolute -left-28 bottom-10 h-80 w-80 rounded-full bg-[#FFC600]/[0.07] blur-3xl" />
                </div>

                {/* Desktop (client mock): a band that fills the first screen below
                    the navbar (capped at 50rem so huge monitors don't stretch it),
                    copy in a wide left column, vehicle large + vertically centered
                    on the right. Mobile keeps the brief's order: title → subheading
                    → description → WhatsApp → photo; dots + Call Now + checkout
                    link continue BELOW the track (shared, static). */}
                {/* lg:max-w-none: the band hugs the panel (copy starts ~4rem from
                    its left edge like the client mock) instead of centering a 7xl
                    container inside wide gutters. Band height = viewport minus the
                    navbar (4.5rem) and the panel's top+bottom insets (3rem at lg),
                    so the panel bottom lands on the fold. */}
                {/* h-full + flex-1 on the copy: slides stretch to the tallest one,
                    so the slack lands between copy and photo and every slide's
                    photo grounds at the same height, just above the dots. */}
                <div
                  className={cn(
                    'relative mx-auto flex h-full w-full max-w-7xl flex-col px-4 sm:px-6 lg:grid lg:h-[clamp(34rem,calc(100svh_-_7.5rem),50rem)] lg:max-w-none lg:items-center lg:gap-8 lg:px-8',
                    slide.desktopCols,
                  )}
                >
                  {/* lg:pl-8 keeps the copy clear of the prev-arrow gutter (arrow
                      spans 16..60px; gutter + px-8 + pl-8 ≥ 64px at every width).
                      flex-1 only acts on mobile — grid items ignore it at lg. */}
                  <div className="flex flex-1 flex-col pt-7 lg:py-10 lg:pl-8">
                    <h1 className="text-2xl font-black leading-[1.12] text-[#0A0A0A] sm:text-4xl xl:text-[3.4rem] xl:leading-[1.08]">
                      {slide.title}
                    </h1>
                    <p className="mt-2.5 text-base font-semibold text-[#C98A00] sm:mt-3 sm:text-lg xl:mt-4 xl:text-xl">
                      {slide.highlight}
                    </p>
                    <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-[#0A0A0A]/70 sm:text-[15px] xl:mt-3.5 xl:text-[17px]">
                      {slide.body}
                    </p>

                    <div className="mt-5 sm:mt-6 lg:mt-8">
                      <WhatsAppCta
                        isActive={isActive}
                        ctaRef={i === 0 ? (el) => (heroWaBtn.current = el) : undefined}
                      />
                    </div>

                    {/* Desktop keeps the full CTA stack in the copy column. */}
                    <div className="mt-3 hidden lg:block">
                      <SecondaryCtas isActive={isActive} />
                    </div>
                  </div>

                  {/* Photo — mobile: slot bleeds to the panel's side edges below the
                      CTA. Desktop: the slot stretches the band's full height
                      (lg:h-auto lets self-stretch win over the mobile heights) and
                      -mr-8 cancels the container's px-8 so it reaches the panel's
                      right edge. Bottom-anchored: the vehicles stand on the panel's
                      bottom border, so where a photo ends at the panel edge it
                      reads as framing, not a cut. */}
                  <div
                    className={cn(
                      'relative -mx-4 mt-4 overflow-hidden sm:-mx-6 lg:-mr-8 lg:ml-0 lg:mt-0 lg:h-auto lg:self-stretch',
                      slide.photoSlot,
                    )}
                  >
                    {/* The image box can be taller than the slot (photoInset with a
                        negative bottom); the slot's overflow-hidden crops the
                        overhang, cutting the subject at the panel border. */}
                    <div className={cn('absolute', slide.photoInset)}>
                      <Image
                        src={slide.image}
                        alt={slide.alt}
                        fill
                        preload={i === 0}
                        quality={90}
                        sizes="(max-width: 1024px) 100vw, 75vw"
                        className="object-contain object-bottom"
                      />
                    </div>

                    {/* Mobile arrows straddle the photo itself (brief item 3 mock). */}
                    <button
                      type="button"
                      onClick={prev}
                      tabIndex={isActive ? 0 : -1}
                      aria-label="Previous slide"
                      className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0A0A0A] shadow-md ring-1 ring-black/5 transition-colors hover:bg-white lg:hidden"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={next}
                      tabIndex={isActive ? 0 : -1}
                      aria-label="Next slide"
                      className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0A0A0A] shadow-md ring-1 ring-black/5 transition-colors hover:bg-white lg:hidden"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Mobile: dots, then Call Now + checkout link, below the photo (brief
            item 2 order). Static — they don't translate with the slide track. */}
        {/* relative: must be positioned to paint above the absolute decor layer. */}
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-7 sm:px-6 lg:hidden">
          <div className="mt-3 flex justify-center gap-2">{dots}</div>
          <div className="mt-4">
            <SecondaryCtas />
          </div>
        </div>

        {/* Desktop arrows at the panel's outer edges (the photo bleeds to the
            viewport edge, so the panel edge IS the content edge). */}
        <button
          type="button"
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0A0A0A] shadow-md ring-1 ring-black/5 transition-colors hover:bg-white lg:flex"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0A0A0A] shadow-md ring-1 ring-black/5 transition-colors hover:bg-white lg:flex"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Desktop dots */}
        <div className="absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 gap-2 lg:flex">
          {dots}
        </div>

      </div>

      {/* The fixed, scroll-triggered teaser lives outside the overflow-hidden
          panel (and any transformed ancestor) so position:fixed pins it to the
          viewport. */}
      {teaserVisible && <PriceTeaserFixed onDismiss={() => setTeaserDismissed(true)} />}
    </section>
  )
}
