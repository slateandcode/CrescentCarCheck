'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Camera, CheckCircle2, FileText } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { ButtonLink } from '@/components/ui/ButtonLink'

const REPORT_META = [
  ['Package', 'Premium · 600+ point check'],
  ['Inspection Date', '20 May 2026'],
  ['Reference', 'CCR-2026-0003'],
  ['Crescent Score', '83/100'],
]

export function SampleReport() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section className="bg-light-bg section-padding">
      <div
        ref={ref}
        className="reveal container-wide grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
      >
        <div>
          <h2 className="text-display-sm md:text-display-md font-bold text-light-text">
            See Exactly What You&apos;re Buying
          </h2>
          <p className="text-light-text-secondary leading-relaxed mt-4">
            Every inspection ends with a detailed digital report: clear status on every system,
            photos of anything worth flagging, and a plain-English summary you can hand straight to
            the seller. Delivered the same day.
          </p>

          <ul className="space-y-3 mt-6">
            <li className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span className="text-light-text-secondary">
                <span className="font-semibold text-light-text">PDF + web report</span>, shareable,
                printable, searchable.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Camera className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span className="text-light-text-secondary">
                <span className="font-semibold text-light-text">Photos of every finding</span>, no
                vague claims, just evidence.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span className="text-light-text-secondary">
                <span className="font-semibold text-light-text">Pass / Watch / Fail</span> on every
                category, no guesswork.
              </span>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <ButtonLink href="/sample-report" size="lg" arrow>
              View Sample Report
            </ButtonLink>
            <Link
              href="/packages"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-light-text hover:text-accent hover:gap-2.5 transition-all duration-200"
            >
              See what&apos;s included
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[400px]">
          <div className="absolute -inset-4 bg-accent/10 rounded-card-lg blur-2xl" aria-hidden="true" />
          <div
            className="relative aspect-[210/297] overflow-hidden rounded-card-lg border border-border bg-gradient-to-b from-surface to-background shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
            role="img"
            aria-label="Sample Crescent Car Check inspection report — cover page for a 2021 Toyota Land Cruiser, Crescent Score 83 out of 100, verdict: Negotiate"
          >
            {/* Large crescent watermark, bleeding off the bottom-right corner */}
            <Image
              src="/Crescent.png"
              alt=""
              width={460}
              height={460}
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -right-20 w-[80%] max-w-none select-none opacity-[0.05]"
            />

            <span className="absolute right-5 top-5 sm:right-6 sm:top-6 text-[9px] font-semibold uppercase tracking-[0.25em] text-text-muted">
              Sample
            </span>

            <div className="relative flex h-full flex-col justify-between p-6 sm:p-7">
              {/* Logo */}
              <div className="relative h-9 w-[140px] sm:h-10 sm:w-[156px]">
                <Image
                  src="/Logo Non BG.png"
                  alt="Crescent Car Check"
                  fill
                  sizes="156px"
                  className="object-contain object-left"
                />
              </div>

              {/* Cover details */}
              <div>
                <div className="h-1 w-10 rounded-full bg-accent" aria-hidden="true" />
                <p className="mt-4 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                  Vehicle Inspection Report
                </p>
                <h3 className="mt-2 text-2xl sm:text-[1.75rem] font-bold leading-[1.05] tracking-tight text-text-primary">
                  2021 Toyota Land Cruiser
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-text-secondary">
                  GCC · Automatic · Petrol · Pearl White
                </p>

                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3.5">
                  {REPORT_META.map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[9px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                        {k}
                      </dt>
                      <dd className="mt-1 text-xs sm:text-sm font-semibold text-text-primary">{v}</dd>
                    </div>
                  ))}
                </dl>

                <span className="mt-5 inline-flex items-center gap-2 rounded-button bg-white px-3.5 py-1.5 text-sm font-bold text-background">
                  <span className="h-2 w-2 rounded-full bg-warning" aria-hidden="true" />
                  Negotiate
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
