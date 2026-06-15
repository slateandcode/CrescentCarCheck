# Deployment Checklist — Crescent Car Check

The site is **code-complete and integration-ready**. Every backend is wired but
**dormant** until you add its keys — no code changes needed. This is your list of
things to do before (and right after) going live.

Copy `.env.example` → `.env.local` (local) or set the same vars in your host's
environment settings (production). See `BACKEND_SETUP.md` for full per-service steps.

---

## 1. Must-do before launch

### Business contact details (public — shown across the site)
- [ ] `NEXT_PUBLIC_BUSINESS_PHONE` — real number, e.g. `+9715XXXXXXXX`
- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER` — digits only, e.g. `9715XXXXXXXX`
- [ ] `NEXT_PUBLIC_BUSINESS_EMAIL` — public contact address
- [ ] `NEXT_PUBLIC_APP_URL` — the **real production domain** (powers SEO, sitemap, OG image)
- [ ] `NEXT_PUBLIC_INSTAGRAM_URL` — optional; footer icon only appears when set

### Bookings database — Supabase
This website owns **no migrations**. The `bookings`/contact schema and its RPCs live
in the **Crescent Car Reports** repo (project `jwslaqufrdoodsxasxnr`) — point this
site at that same Supabase project. **Do not** `supabase db push` from this repo; see
`BACKEND_SETUP.md` §1.
- [ ] Point this site at the same Supabase project as Crescent Car Reports
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Ensure the Reports repo's booking migrations have been applied to that project
- [ ] Submit a test booking and confirm the row appears in the `bookings` table

> Until configured, the booking form works and returns a reference, but **nothing is saved.**

### Booking & contact emails — Resend
- [ ] Create a Resend account and **verify your sending domain**
- [ ] Set `RESEND_API_KEY`
- [ ] Set `RESEND_FROM_EMAIL` — an address on the verified domain
- [ ] Set `BUSINESS_OWNER_EMAIL` — where booking/contact alerts are sent
- [ ] Send a test booking + contact message and confirm both emails arrive

### Content / assets
- [ ] Replace **About-page photos** — currently Unsplash stock placeholders
- [ ] Replace **Recently Inspected Cars** placeholders — currently icon placeholders, no real photos
- [ ] Review **Testimonials** — currently placeholder names from the brief (marked `// TODO`); only publish once you have real reviews
- [ ] Replace the **Sample Report** mock with a real report preview if/when available

### Domain & hosting — Netlify + GoDaddy
Hosting is **Netlify**; the domain is registered at **GoDaddy**. A `netlify.toml`
is committed (build command, publish dir, Next.js runtime plugin).

**Netlify:**
- [ ] Connect the GitHub repo as a new Netlify site (build settings are read from `netlify.toml`)
- [ ] Set **all** env vars from `.env.local` in **Site settings → Environment variables**
      (production needs them too — `.env.local` is local-only and not deployed)
- [ ] Set `NEXT_PUBLIC_APP_URL` to the **real production domain** (https)
- [ ] Trigger a deploy and confirm it builds green

**GoDaddy DNS** (point the domain at Netlify — use Netlify DNS *or* keep GoDaddy DNS):
- [ ] Add the custom domain in Netlify (Domain management → Add a domain)
- [ ] *Either* set GoDaddy nameservers to Netlify's (Netlify DNS — simplest, also covers Resend records),
      *or* keep GoDaddy DNS and add the records Netlify shows:
  - apex `@` → Netlify's load-balancer `A` record (or `ALIAS`/`ANAME` if offered)
  - `www` → `CNAME` to the Netlify site (`<site>.netlify.app`)
- [ ] Add the **Resend** domain-verification records at the same DNS host (see Resend section) —
      SPF, DKIM, and (recommended) DMARC
- [ ] Let Netlify provision the Let's Encrypt cert; confirm **HTTPS** is active on apex + www
- [ ] Confirm `www` → apex (or chosen canonical) redirect works

---

## 2. Recommended before / soon after launch

### Analytics — Google Analytics 4
- [ ] Create a GA4 property
- [ ] Set `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`

> All event tracking is already wired; nothing emits until this ID is set.

### Error monitoring — Sentry
- [ ] Create a Sentry project
- [ ] Set `NEXT_PUBLIC_SENTRY_DSN` (browser) and/or `SENTRY_DSN` (server)
- [ ] *(Optional, for readable stack traces)* set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`,
      `SENTRY_PROJECT` and wrap `next.config.ts` with `withSentryConfig`

> With no DSN, zero Sentry code loads — the bundle stays lean.

### Checkout map — Google Maps
- [ ] In Google Cloud, enable **Maps JavaScript API**, **Places API (New)**, **Geocoding API**
- [ ] Create an API key and restrict it (HTTP referrers → production domain + `localhost`)
- [ ] Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] Open `/checkout` and confirm search + draggable pin + auto-filled address work

> Until the key is set, the map is hidden and customers type their address — booking still works.

---

## 3. Optional / later

### Online payment — Stripe
> **Required before launch.** Intended flow: choose package → choose emirate →
> choose time window → **pay online at booking** → we confirm the exact arrival
> time by WhatsApp. The UI copy already states payment is taken at booking, but
> the Checkout step is **not wired yet** — the form currently submits without
> charging. Wire Stripe so the copy is truthful.
- [ ] Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- [ ] Add a Checkout Session route that charges `record.totalPrice`; webhook sets `payment_status = paid`

### Cleanup / hardening (developer tasks)
- [ ] Add a Content-Security-Policy in `next.config.ts` (needs nonces/hashes for the inline
      anim-gate, JSON-LD, GA/Sentry scripts) — intentionally not set yet
- [ ] Review the placeholder Privacy / Terms legal copy with your own wording

---

## Quick reference

| Service   | Site works without it? | What breaks while empty |
|-----------|------------------------|--------------------------|
| Supabase  | Yes                    | Bookings aren't saved |
| Resend    | Yes                    | No booking/contact emails sent |
| GA4       | Yes                    | No analytics collected |
| Sentry    | Yes                    | No error monitoring |
| Stripe    | Yes                    | (Not used yet) |
| Contact details | Yes (placeholders show) | Wrong phone/email/WhatsApp shown |

Full activation details for every item above: **`BACKEND_SETUP.md`**.
