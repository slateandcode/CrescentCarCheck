import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'

type CssVars = React.CSSProperties & { '--i'?: number }

const TRUST_ITEMS = ['Certified Inspectors', 'Same-Day Slots', 'Instant Reports']

/** Shared content of the gold panel — reused by the mobile and desktop layouts. */
function PanelContent() {
  return (
    <>
      <h1
        className="hero-fx-item text-2xl sm:text-4xl lg:text-4xl xl:text-5xl font-black leading-[1.1] sm:leading-[1.08]"
        style={{ '--i': 0 } as CssVars}
      >
        Buy With Confidence and Avoid Hidden Surprises!
      </h1>
      <p
        className="hero-fx-item text-background/80 text-sm sm:text-base mt-2.5 sm:mt-4 leading-relaxed"
        style={{ '--i': 1 } as CssVars}
      >
        We help used car buyers avoid costly mistakes by uncovering hidden damage,
        mechanical defects, accident history, fault codes and more — so you know
        exactly what you&apos;re buying before you pay.
      </p>

      <div className="hero-fx-item mt-5 sm:mt-6" style={{ '--i': 2 } as CssVars}>
        <ButtonLink
          href="/packages"
          size="lg"
          arrow
          fullWidth
          className="xs:w-auto bg-background text-accent hover:bg-background/90"
        >
          Book Inspection
        </ButtonLink>
      </div>

      <div
        className="hero-fx-item flex flex-wrap items-center gap-x-4 gap-y-2 mt-5 pt-4 sm:mt-6 sm:pt-5 border-t border-background/15"
        style={{ '--i': 3 } as CssVars}
      >
        {TRUST_ITEMS.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-background/90"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {item}
          </span>
        ))}
      </div>
    </>
  )
}

export function HeroSection() {
  return (
    <section className="relative bg-background overflow-hidden">
      {/*
        Mobile / tablet: stacked layout (closer to the VerifyBuy reference).
        The inspector photo reads clearly up top; the gold card sits below and
        overlaps the image only slightly, so it never blocks the subject.
      */}
      <div className="lg:hidden container-wide pt-24 sm:pt-28 pb-12">
        {/*
          Banner is a wide ~21:9 landscape with the inspector + car on the LEFT,
          so we frame it in a rounded card and bias the crop left (object-left)
          to keep the subject in view rather than the empty pavement on the right.
        */}
        <div className="relative w-full aspect-[4/3] xs:aspect-[3/2] rounded-card-lg overflow-hidden shadow-2xl">
          <Image
            src="/Banner.png"
            alt="Crescent Car Check inspector examining a vehicle on-site"
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover object-left hero-fx-img"
          />
        </div>

        {/* Gold card overlaps the photo only slightly, with matching rounded corners */}
        <div className="hero-fx-panel relative z-10 -mt-8 bg-accent text-background rounded-card-lg p-6 sm:p-8 shadow-2xl">
          <PanelContent />
        </div>
      </div>

      {/*
        Desktop: full-bleed inspector photo with the gold panel floated to the
        right — unchanged premium Crescent treatment.
      */}
      <div className="hidden lg:flex relative min-h-[100svh] items-center overflow-hidden">
        <Image
          src="/Banner.png"
          alt="Crescent Car Check inspector examining a vehicle on-site"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-[center_38%] hero-fx-img"
        />

        {/* Readability scrim — darkens the photo so the panel reads on any crop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/15 to-black/70"
        />

        <div className="relative z-10 container-wide w-full pt-28 pb-12">
          <div className="flex justify-end">
            <div className="hero-fx-panel bg-accent text-background rounded-card-lg p-10 shadow-2xl w-[46%]">
              <PanelContent />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
