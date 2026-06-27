'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Camera, CheckCircle2, FileText } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { ButtonLink } from '@/components/ui/ButtonLink'

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
            Preview the Report You&apos;ll Receive
          </h2>
          <p className="text-light-text-secondary leading-relaxed mt-4">
            You&apos;ll get a clear breakdown of the car&apos;s condition, photos of any issues
            found, and a plain-English recommendation on whether to buy, negotiate or avoid.
          </p>

          <ul className="space-y-3 mt-6">
            <li className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span className="text-light-text-secondary">
                <span className="font-semibold text-light-text">PDF report</span>, easy to view,
                share and keep.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Camera className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span className="text-light-text-secondary">
                <span className="font-semibold text-light-text">Photos &amp; explanations</span>,
                clear evidence for flagged issues.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span className="text-light-text-secondary">
                <span className="font-semibold text-light-text">Pass / Minor Fail / Major Fail</span>,
                simple ratings with no guesswork.
              </span>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <ButtonLink href="/sample-report" size="lg" arrow>
              View Report Preview
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
          <div className="relative aspect-[210/297] overflow-hidden rounded-card-lg border border-border shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
            {/* Real first page of a Crescent Car Check inspection report. */}
            <Image
              src="/sample-report-cover.jpg"
              alt="Sample Crescent Car Check inspection report — cover page for a 2021 Toyota Land Cruiser (Premium inspection), Crescent Score 82 out of 100"
              fill
              sizes="(min-width: 1024px) 400px, 90vw"
              className="object-cover"
            />
            <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/85 backdrop-blur-sm">
              Sample
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
