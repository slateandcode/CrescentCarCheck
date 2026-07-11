import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { FloatingContactButtons } from '@/components/layout/WhatsAppButton'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
}

// Build metadataBase defensively: a bare domain pasted into the env UI (no
// scheme) would otherwise make `new URL()` throw at module load and break EVERY
// route. Prepend https:// when missing, and fall back to the canonical URL if
// the value is still unparseable.
function resolveMetadataBase(): URL {
  const fallback = 'https://crescentcarcheck.com'
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const candidate = raw ? (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`) : fallback
  try {
    return new URL(candidate)
  } catch {
    return new URL(fallback)
  }
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: 'Crescent Car Check | Professional Car Inspections in UAE',
    template: '%s | Crescent Car Check',
  },
  description:
    'Book an independent pre-purchase car inspection across the UAE, on-site at the seller, with a same-day digital report. Available in Dubai, Abu Dhabi, Sharjah and all Emirates.',
  keywords: [
    'car inspection UAE', 'pre-purchase car inspection Dubai',
    'used car inspection', 'vehicle inspection UAE', 'car check UAE',
    'car inspection Abu Dhabi', 'car inspection Sharjah',
    'pre-purchase vehicle check', 'used car check Dubai',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_AE',
    siteName: 'Crescent Car Check',
    title: 'Crescent Car Check | Professional Car Inspections in UAE',
    description:
      'Independent pre-purchase car inspections across the UAE. Same-day digital reports. From AED 299.',
    // og:image is provided automatically by app/opengraph-image.tsx
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crescent Car Check',
    description: 'Professional car inspections across the UAE. Book online.',
  },
  robots: { index: true, follow: true },
  // Google Search Console ownership proof (renders <meta name="google-site-verification">).
  // Only needed for the "HTML tag" verification method — a DNS TXT record on the
  // domain works without this. Unset = tag omitted.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  // Favicon + icon come from the app/favicon.ico and app/icon.png file
  // conventions (both generated from public/Crescent.png).
}

// Inline gate script: arms reveal/hero animations only after this runs (in <head>,
// before first paint). If JS is disabled or blocked, the class is never set and
// every animated section stays visible — so the page can never look "blank".
const ANIM_GATE_SCRIPT =
  "document.documentElement.classList.add('js-anim-ready')"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANIM_GATE_SCRIPT }} />
      </head>
      {/* GTM loads after hydration (afterInteractive) — doesn't block first paint.
          If GA4 is ever configured INSIDE this GTM container, unset
          NEXT_PUBLIC_GA_MEASUREMENT_ID below or pageviews double-count. */}
      {process.env.NEXT_PUBLIC_GTM_ID && (
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
      )}
      <body>
        <Navbar />
        <main id="main-content">{children}</main>
        <Footer />
        <FloatingContactButtons />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  )
}
