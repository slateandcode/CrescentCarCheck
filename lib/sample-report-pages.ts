// Pages shown in the "View Report Preview" experience on /sample-report.
//
// The first FREE_PAGES render clearly; everything after is blurred and locked
// behind a "Book an inspection" CTA. This is asset-driven: as the client
// delivers real report pages, drop the images into /public and append them
// here — no component changes needed.
//
// Until real inner pages exist, `lockedPlaceholder` is shown (blurred) as the
// teaser "locked" page so the concept reads as intentional at launch.

export interface ReportPage {
  src: string
  alt: string
}

/** Real, unlocked pages the visitor can read in full. */
export const REPORT_PAGES: ReportPage[] = [
  {
    src: '/sample-report-cover.jpg',
    alt: 'Crescent Car Check inspection report — cover page',
  },
  // TODO: append real inner pages here as the client provides them, e.g.
  // { src: '/sample-report/page-2.jpg', alt: 'Inspection report — summary page' },
]

/** How many pages from REPORT_PAGES render clearly before the lock kicks in. */
export const FREE_PAGES = 1

/**
 * Placeholder image used (blurred) for the locked teaser page when there are no
 * real inner pages yet. Set to null once REPORT_PAGES has more than FREE_PAGES
 * real entries and you no longer want a duplicate placeholder.
 */
export const LOCKED_PLACEHOLDER: string | null = '/sample-report-cover.jpg'
