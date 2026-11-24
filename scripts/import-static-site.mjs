#!/usr/bin/env node
// Imports the client's static HTML site (the zip Ronnie sends) into public/ and
// adapts it to live at the site root alongside the Next.js app.
//
//   node scripts/import-static-site.mjs [path/to/extracted-zip]   (default: crescent-site-updated)
//
// What it does, every run (safe to re-run on each new zip):
//   1. Removes the pages/assets the previous import wrote (static-site/pages.json).
//   2. Copies assets/ to public/assets/ (skips _-prefixed leftovers, __MACOSX, .DS_Store).
//   3. Copies each page to public/<page>/index.html, rewriting:
//        - canonical/og URLs from /book-inspection/... to the root domain
//        - internal links and asset paths to absolute (/pricing, /assets/...),
//          so they work without trailing slashes
//        - adds an "About Us" link to the desktop nav and mobile menu
//   4. Builds public/about/index.html from one of the client's subpages as the
//      shell (header, menu, footer, dialogs, scripts) + static-site/about.main.html
//      + the "Brands we inspect" strip lifted from the home page.
//   5. Writes static-site/pages.json, which next.config.ts reads to route
//      /<page> to public/<page>/index.html.

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.resolve(ROOT, process.argv[2] || 'crescent-site-updated')
const PUBLIC = path.join(ROOT, 'public')
const EXTRAS = path.join(ROOT, 'static-site')
const MANIFEST = path.join(EXTRAS, 'pages.json')
const DOMAIN = 'https://crescentcarcheck.com'
const SHELL_PAGE = 'how-it-works'

const fail = (msg) => {
  console.error(`\n✗ ${msg}\n`)
  process.exit(1)
}

if (!fs.existsSync(path.join(SRC, 'index.html'))) fail(`No index.html in ${SRC}`)
if (!fs.existsSync(path.join(SRC, 'assets'))) fail(`No assets/ folder in ${SRC}`)

// ---- pages in the zip -------------------------------------------------------
const pages = fs
  .readdirSync(SRC, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(SRC, d.name, 'index.html')))
  .map((d) => d.name)
  .sort()
if (pages.includes('about')) fail('The zip now has its own about/ page; decide which About to keep before importing.')
if (!pages.includes(SHELL_PAGE)) fail(`Shell page ${SHELL_PAGE}/ is missing from the zip; pick another in SHELL_PAGE.`)
const allPages = [...pages, 'about']

// ---- 1. clean the previous import --------------------------------------------
const previous = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).pages : []
for (const p of new Set([...previous, ...allPages])) {
  fs.rmSync(path.join(PUBLIC, p), { recursive: true, force: true })
}
fs.rmSync(path.join(PUBLIC, 'assets'), { recursive: true, force: true })
fs.rmSync(path.join(PUBLIC, 'index.html'), { force: true })

// ---- 2. assets ---------------------------------------------------------------
const skip = (name) => name.startsWith('_') || name === '__MACOSX' || name === '.DS_Store'
fs.cpSync(path.join(SRC, 'assets'), path.join(PUBLIC, 'assets'), {
  recursive: true,
  filter: (src) => !skip(path.basename(src)),
})

// ---- 3. pages ----------------------------------------------------------------
const pageAlt = allPages.join('|')

function mustReplace(html, pattern, replacement, what, file) {
  if (!pattern.test(html)) fail(`${file}: couldn't find ${what}. The client's markup changed; update the script.`)
  pattern.lastIndex = 0
  return html.replace(pattern, replacement)
}

function transform(html, file) {
  // canonical / og URLs: /book-inspection/x/ -> /x, /book-inspection -> /
  html = html
    .replaceAll(`${DOMAIN}/book-inspection/assets/`, `${DOMAIN}/assets/`)
    .replace(new RegExp(`${DOMAIN}/book-inspection/(${pageAlt})/`, 'g'), `${DOMAIN}/$1`)
    .replaceAll(`${DOMAIN}/book-inspection"`, `${DOMAIN}/"`)
  if (html.includes('/book-inspection')) fail(`${file}: still references /book-inspection after rewriting.`)

  // asset paths -> absolute
  html = html.replace(/(href|src)="(?:\.\.\/)?assets\//g, '$1="/assets/')
  // internal page links -> absolute, no trailing slash
  html = html.replace(new RegExp(`href="(?:\\.\\./)?(${pageAlt})/"`, 'g'), 'href="/$1"')
  html = html.replace(/href="\.\.\/"/g, 'href="/"')

  // About link: desktop nav and mobile menu
  html = mustReplace(
    html,
    /(<nav class="top__nav"[\s\S]*?)(\n\s*<\/nav>)/,
    `$1\n          <a href="/about">About Us</a>$2`,
    'the desktop nav (nav.top__nav)',
    file,
  )
  html = mustReplace(
    html,
    /(<nav class="menu__nav"[\s\S]*?)(\n\s*<\/nav>)/,
    `$1\n        <a href="/about"\n          ><svg class="i"><use href="#i-shield" /></svg>About Us<svg class="i">\n            <use href="#i-chev-r" /></svg\n        ></a>$2`,
    'the mobile menu (nav.menu__nav)',
    file,
  )
  return html
}

const write = (rel, html) => {
  const out = path.join(PUBLIC, rel)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, html)
}

const home = transform(fs.readFileSync(path.join(SRC, 'index.html'), 'utf8'), 'index.html')
write('index.html', home)
for (const p of pages) {
  write(`${p}/index.html`, transform(fs.readFileSync(path.join(SRC, p, 'index.html'), 'utf8'), `${p}/index.html`))
}

// ---- 4. about page -----------------------------------------------------------
let about = transform(fs.readFileSync(path.join(SRC, SHELL_PAGE, 'index.html'), 'utf8'), `${SHELL_PAGE} (about shell)`)
const title = 'About Us: Independent Car Inspectors in the UAE | Crescent Car Check'
const desc =
  'Crescent Car Check helps UAE buyers purchase used cars with confidence. Learn about our inspectors, our values, and why we do what we do.'
about = mustReplace(about, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`, '<title>', 'about')
about = mustReplace(about, /(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${desc}$2`, 'meta description', 'about')
about = mustReplace(about, /(<meta\s+property="og:title"\s+content=")[^"]*(")/, `$1${title}$2`, 'og:title', 'about')
about = mustReplace(about, /(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${desc}$2`, 'og:description', 'about')
about = about.replaceAll(`${DOMAIN}/${SHELL_PAGE}`, `${DOMAIN}/about`)
about = about.replace(/ class="is-active" aria-current="page"/g, '')
about = about.replace(/<a href="\/about"/g, '<a href="/about" class="is-active" aria-current="page"')

const brands = home.match(/\n\s*<!-- \d+\. BRANDS WE INSPECT -->[\s\S]*?<section\s+class="sec paper brands"[\s\S]*?<\/section>/)
if (!brands) fail('index.html: couldn\'t find the "Brands we inspect" section to reuse on About.')
const aboutMain = fs.readFileSync(path.join(EXTRAS, 'about.main.html'), 'utf8').replace('<!-- BRANDS -->', brands[0].trim())
about = mustReplace(about, /    <main id="top">[\s\S]*?<\/main>\n?/, aboutMain, '<main id="top">', 'about')
write('about/index.html', about)

// ---- 5. manifest -------------------------------------------------------------
fs.writeFileSync(MANIFEST, JSON.stringify({ source: path.relative(ROOT, SRC), pages: allPages }, null, 2) + '\n')

console.log(`✓ Imported ${pages.length + 1} client pages + about into public/`)
console.log(`  routes: / ${allPages.map((p) => '/' + p).join(' ')}`)
