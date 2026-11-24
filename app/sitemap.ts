import type { MetadataRoute } from 'next'

// Mirrors the metadataBase fallback in app/layout.tsx. Set NEXT_PUBLIC_APP_URL
// to the production domain so these URLs are absolute and correct.
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://crescentcarcheck.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  // Public, indexable routes only. /confirmation and /thank-you are noindex
  // and /api is excluded.
  const routes: Array<{
    path: string
    priority: number
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  }> = [
    // Static marketing pages (public/, see scripts/import-static-site.mjs).
    { path: '', priority: 1, changeFrequency: 'weekly' },
    { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/what-we-check', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/how-it-works', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/sample-report', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/recently-inspected', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/reviews', priority: 0.6, changeFrequency: 'weekly' },
    { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
  ]

  return routes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
