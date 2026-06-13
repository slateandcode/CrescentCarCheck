import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://crescentcarcheck.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /api holds only POST endpoints. /confirmation is intentionally NOT
      // disallowed: the page already sets `noindex`, and a robots.txt Disallow
      // would stop crawlers from fetching it and ever seeing that noindex —
      // letting a shared URL surface as a bare listing. Crawlable + noindex
      // gets it fully dropped instead.
      disallow: ['/api/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    // The non-standard Host directive expects a bare hostname, not a URL with a
    // scheme (Next emits `Host: <value>` verbatim).
    host: new URL(BASE_URL).host,
  }
}
