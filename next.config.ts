import type { NextConfig } from 'next'

// Content-Security-Policy, shipped in REPORT-ONLY first (the staged rollout the
// audit recommends for a payments+PII site): it reports violations to the browser
// console without blocking anything, so it can't break the Google-Maps checkout,
// Stripe redirect, GA or the inline scripts. Validate the reports against the live
// site, tighten any missing origin, THEN flip the header key below to the
// enforcing 'Content-Security-Policy' to turn protection on.
//
// It is already enforce-ready: our only executable inline script (the pre-paint
// anim-gate in app/layout.tsx) is pinned by its sha256 hash; the JSON-LD is a
// non-executable application/ld+json block (not governed by script-src). The
// allow-list covers GA (googletagmanager / google-analytics), Google Maps
// (maps.googleapis / gstatic / googleapis), Stripe and Sentry.
const ANIM_GATE_HASH = "'sha256-EFyO0q8lT+1JY/izqxr4Yep8HneQdxKiIEObyb2vHeA='"
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src 'self' ${ANIM_GATE_HASH} https://www.googletagmanager.com https://maps.googleapis.com https://js.stripe.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://images.unsplash.com https://maps.gstatic.com https://*.googleapis.com https://*.google.com https://*.ggpht.com https://*.googleusercontent.com https://www.google-analytics.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://maps.googleapis.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://api.stripe.com https://*.ingest.sentry.io https://*.sentry.io",
  "frame-src https://js.stripe.com https://*.stripe.com https://www.google.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ')

// Baseline security headers applied to every route.
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // 1 year HSTS, no `preload` so we don't commit the domain to the preload list.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // See the note above before flipping this to 'Content-Security-Policy'.
  { key: 'Content-Security-Policy-Report-Only', value: csp },
]

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    // Next 16 only generates the quality variants listed here (default [75]).
    // Our <Image> components request 88/90/95; without these, Next logs a warning
    // and serves the image un-optimised at the requested quality.
    qualities: [75, 88, 90, 95],
  },
  logging: {
    fetches: { fullUrl: false },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
