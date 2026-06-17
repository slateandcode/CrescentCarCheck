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

// Pages from a real inspection report (ref CCR-2026-0014, 2016 Challenger).
// Confidential fields (customer name/phone/email, inspector, VIN, plate) are
// permanently blurred into the page-1/page-2 image files — not just CSS — since
// these pages render in full to the public. Page 3 is shown blurred (locked).
/** Real pages: the first FREE_PAGES render clearly, the rest render locked/blurred. */
export const REPORT_PAGES: ReportPage[] = [
  {
    src: '/sample-report/page-1.jpg',
    alt: 'Crescent Car Check inspection report — cover page',
  },
  {
    src: '/sample-report/page-2.jpg',
    alt: 'Crescent Car Check inspection report — vehicle summary page',
  },
  {
    src: '/sample-report/page-3.jpg',
    alt: 'Crescent Car Check inspection report — executive summary page',
  },
]

/** How many pages from REPORT_PAGES render clearly before the lock kicks in. */
export const FREE_PAGES = 2

/**
 * Fallback teaser image used (blurred) only when REPORT_PAGES has no real pages
 * beyond FREE_PAGES. Now null because page 3 is a real locked page.
 */
export const LOCKED_PLACEHOLDER: string | null = null
