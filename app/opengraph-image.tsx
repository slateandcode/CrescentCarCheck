import { ImageResponse } from 'next/og'

// Branded social-share card, generated at build time. Replaces the old static
// /og-image.jpg reference (which never existed). Because this file lives at the
// app root, Next.js automatically wires it into og:image AND (as a fallback)
// twitter:image for every page.

export const alt =
  'Crescent Car Check — Independent pre-purchase car inspections across the UAE'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0A0A0A',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
              fill="#FFC600"
            />
          </svg>
          <span
            style={{
              color: '#FFFFFF',
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            CRESCENT CAR CHECK
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              color: '#FFFFFF',
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              maxWidth: 920,
            }}
          >
            Know exactly what you&apos;re buying.
          </div>
          <div
            style={{
              display: 'flex',
              color: '#A1A1AA',
              fontSize: 34,
              fontWeight: 400,
              marginTop: 24,
              maxWidth: 880,
            }}
          >
            Independent pre-purchase car inspections, on-site across the UAE.
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#FFC600',
              color: '#0A0A0A',
              fontSize: 28,
              fontWeight: 700,
              padding: '14px 28px',
              borderRadius: 9999,
            }}
          >
            Standard & Premium · From AED 299
          </div>
          <div style={{ display: 'flex', color: '#71717A', fontSize: 26 }}>
            crescentcarcheck.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
