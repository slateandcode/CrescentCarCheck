import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { FileText, Camera, CheckCircle2, Lock } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { cn } from '@/lib/utils'
import { REPORT_PAGES, FREE_PAGES, LOCKED_PLACEHOLDER } from '@/lib/sample-report-pages'

export const metadata: Metadata = {
  title: 'Report Preview',
  description:
    'Preview what a Crescent Car Check inspection report looks like — clear status on every system, photos of every finding, and a plain-English verdict.',
}

const WHAT_TO_EXPECT = [
  {
    Icon: CheckCircle2,
    title: 'Pass / Minor Fail / Major Fail',
    body: 'Each inspected item is clearly marked, so you can quickly understand what passed, what needs attention, and what could be a serious concern.',
  },
  {
    Icon: Camera,
    title: 'Photos & Explanations',
    body: 'Where an issue is found, we include supporting photos and clear explanations so you can understand exactly what our inspector saw.',
  },
  {
    Icon: FileText,
    title: 'Score & Recommendation',
    body: 'We assign an overall Crescent Score, score each key section of the vehicle, and give a clear recommendation on whether to buy, negotiate or avoid.',
  },
]

// The pages a visitor can read in full, plus any locked teaser pages. When real
// inner pages haven't been added yet, a blurred placeholder stands in so the
// "locked" concept reads as intentional.
const lockedRealPages = REPORT_PAGES.slice(FREE_PAGES)
const previewPages = [
  ...REPORT_PAGES.slice(0, FREE_PAGES).map((p) => ({ ...p, locked: false })),
  ...(lockedRealPages.length > 0
    ? lockedRealPages.map((p) => ({ ...p, locked: true }))
    : LOCKED_PLACEHOLDER
      ? [{ src: LOCKED_PLACEHOLDER, alt: '', locked: true }]
      : []),
]

export default function SampleReportPage() {
  return (
    <>
      <section className="bg-background page-header">
        <div className="container-wide">
          <div className="max-w-3xl">
            <p className="text-accent font-bold tracking-[0.2em] uppercase text-sm">
              Report Preview
            </p>
            <h1 className="text-display-md sm:text-display-lg md:text-display-xl font-black text-text-primary leading-[1.05] md:leading-[1.02] mt-3 break-words">
              Preview the Report You&apos;ll <span className="text-accent">Receive</span>
            </h1>
            <p className="text-text-secondary text-base md:text-lg mt-5 max-w-2xl leading-relaxed">
              Every Crescent Car Check inspection ends with a detailed digital report designed to
              make your buying decision clearer. Here&apos;s a preview of the real thing — browse the
              opening pages, then book an inspection to unlock the full report on your dream car.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-light-bg section-padding">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {WHAT_TO_EXPECT.map(({ Icon, title, body }) => (
              <div
                key={title}
                className="bg-light-card rounded-card border border-light-border p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-accent" aria-hidden="true" />
                </div>
                <h2 className="text-light-text font-bold text-lg">{title}</h2>
                <p className="text-light-text-secondary text-sm mt-2 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          {/* Report preview: opening page(s) clear, the rest blurred behind a CTA. */}
          <div className="mt-12 flex flex-col items-center gap-6">
            {previewPages.map((page, i) => (
              <div
                key={`${page.src}-${i}`}
                className="relative w-full max-w-[480px] aspect-[210/297] rounded-card-lg overflow-hidden border border-light-border shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
              >
                <Image
                  src={page.src}
                  alt={page.locked ? '' : page.alt}
                  fill
                  sizes="(min-width: 768px) 480px, 90vw"
                  className={cn(
                    'object-cover',
                    page.locked && 'blur-md scale-110 select-none pointer-events-none'
                  )}
                />

                {!page.locked && (
                  <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/85 backdrop-blur-sm">
                    Page {i + 1}
                  </span>
                )}

                {/* The first locked page carries the unlock CTA. */}
                {page.locked && i === FREE_PAGES && (
                  <div className="absolute inset-0 flex items-center justify-center bg-light-bg/40 backdrop-blur-[2px]">
                    <div className="text-center px-6">
                      <div className="w-14 h-14 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto">
                        <Lock className="w-7 h-7 text-accent" aria-hidden="true" />
                      </div>
                      <h3 className="text-light-text text-xl sm:text-2xl font-bold mt-4">
                        Unlock the full report
                      </h3>
                      <p className="text-light-text-secondary text-sm mt-2 max-w-xs mx-auto leading-relaxed">
                        Book an inspection and receive your own detailed, photo-backed report —
                        delivered the same day.
                      </p>
                      <ButtonLink href="/packages" size="lg" arrow className="mt-6">
                        Book an inspection
                      </ButtonLink>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-button font-semibold px-6 py-3 text-base bg-light-surface text-light-text border border-light-border hover:border-light-border-hover transition-colors duration-200"
            >
              Have a specific car in mind? Ask us
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
