import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Ads landing page, built outside this app as a standalone HTML page with its
// own header, footer, CSS and tracking container. A route handler (not page.tsx)
// keeps it out of the root layout, so the site Navbar/Footer/globals.css can't
// collide with it. Assets live in public/book-inspection/assets.
export const dynamic = 'force-static'

export async function GET() {
  const html = await readFile(join(process.cwd(), 'app/book-inspection/landing.html'), 'utf8')
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
