import type { NextConfig } from 'next'

// Baseline security headers applied to every route. Intentionally NO
// Content-Security-Policy yet: the app serves inline <script> (the pre-paint
// anim-gate + JSON-LD structured data) and third-party GA/Sentry, so a CSP needs
// nonces/hashes to avoid breaking them — tracked as a follow-up in BACKEND_SETUP.md.
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // 1 year HSTS, no `preload` so we don't commit the domain to the preload list.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
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
