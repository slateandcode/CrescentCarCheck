# Backend Setup & Activation Guide

The site is built **integration-ready**: every backend connection is wired but
**dormant** until its environment variables are provided. With empty keys the UI
works fully and nothing external is called. Add the keys (in `.env.local` for
local dev, or your host's env settings for production) and each integration
activates on the next build/deploy — **no code changes required**.

Copy `.env.example` → `.env.local` and fill in what you have.

---

## 1. Supabase (booking database) — `lib/supabase/server.ts`, `lib/availability.ts`, `app/api/bookings/route.ts`

The booking system lives in the **shared Supabase project that the Crescent Car
Reports admin app also uses**, so bookings, inspectors and reports sit in one
database. This website connects with the service-role key and talks to the
database **only through the `SECURITY DEFINER` RPCs** (`booking_slot_availability`,
`create_booking_hold`, `confirm_booking_paid`, `cancel_pending_booking`) — it never
writes the `bookings` table directly. The DB generates the customer-facing
`CCB-XXXXXX` reference and enforces every slot rule atomically.

> ⚠️ **Schema ownership.** The `bookings` table and its RPCs are owned by the
> **Crescent Car Reports** repo's migrations (`006_bookings.sql` +
> `007_simplify_booking_statuses.sql`) and must be applied **from that repo**.
> **Do NOT run this repo's `supabase/migrations/001_bookings.sql` or
> `002_payment_flow.sql`** — both are kept only for history and are headered
> `⚠️ SUPERSEDED / DO NOT APPLY`. Running them (or `supabase db push` from this
> repo) would create a conflicting, outdated table with the wrong status values
> and no RPCs, and `/api/bookings` would 500.

**Activate:**
1. Point this site at the same Supabase project as Crescent Car Reports.
2. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — never exposed to the browser)
3. Ensure the Reports repo's booking migrations have been applied to that project
   (they create the `bookings` table, the RPCs, and the service-role grants).

The live booking flow needs **both Supabase and Stripe** (§5): the customer pays to
secure the slot. Until both are configured, `POST /api/bookings` returns a clean
**503** ("Online booking is temporarily unavailable. Please WhatsApp us to book.")
— the form fails gracefully rather than pretending a booking went through.

## 2. Google Analytics 4 — `app/layout.tsx`, `lib/analytics.ts`

Already wired via `@next/third-parties`. The `<GoogleAnalytics>` tag and all
`trackEvent()` calls (select package, begin/submit checkout, contact, WhatsApp,
FAQ opens, `purchase`) only emit once the measurement ID is present.

**Activate:** set `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`.

## 3. Resend (transactional email) — `lib/resend.ts`, `lib/email.ts`

On a new booking: emails the owner an alert **and** the customer a confirmation
(if they gave an email). On a contact-form submit: emails the owner. All sends are
**best-effort** — a mail failure never fails the user's request.

**Activate:**
1. Create a Resend account and **verify your sending domain**.
2. Set:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL` — an address on the verified domain (e.g.
     `bookings@crescentcarcheck.com`; a bare address is auto-wrapped as
     `Crescent Car Check <…>`).
   - `BUSINESS_OWNER_EMAIL` — where owner notifications go.

## 4. Sentry (error/perf monitoring) — `instrumentation.ts`, `instrumentation-client.ts`

Dormant via dynamic import: with no DSN, **zero** Sentry code loads (the browser
bundle stays lean).

**Activate (basic):** set `NEXT_PUBLIC_SENTRY_DSN` (browser) and/or `SENTRY_DSN`
(server). Server `register()` + `onRequestError` and the browser SDK initialise
automatically.

**Activate (full — source maps & releases):** also set `SENTRY_AUTH_TOKEN`,
`SENTRY_ORG`, `SENTRY_PROJECT`, then wrap `next.config.ts` with
`withSentryConfig` (run `npx @sentry/wizard@latest -i nextjs`, or add the wrapper
manually). This is optional and only needed for readable stack traces in prod.

## 5. Stripe (online payment) — `lib/stripe.ts`

**Required for the live flow.** The intended flow is *choose package → choose
emirate → choose time window → **pay online at booking** → we confirm the exact
arrival time by WhatsApp*. The customer-facing copy already says payment is taken
at booking, and the API derives the authoritative `totalPrice` (package +
travel fee). **The actual Checkout step is not wired yet** — `lib/stripe.ts`
exposes a lazy `getStripe()` + `isStripeConfigured()`, but no route creates a
Checkout Session, so today the form still submits without charging. Wire this
before going live so the copy is truthful.

**When wiring:** set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, create a Checkout Session route that charges
`record.totalPrice`, and have the webhook flip `payment_status` to `paid`. The
`bookings` table already has `stripe_session_id` / `stripe_payment_intent_id` /
`payment_status` columns, plus `travel_fee` / `total_price`.

## 6. Google Maps (checkout location picker) — `components/checkout/LocationMap.tsx`

The checkout location picker (search box + draggable pin + reverse-geocoded
address) runs on the **Google Maps JavaScript API**. Until a key is set, the map
is hidden and the customer simply types their address in the field below it — the
booking still works.

**Activate:**
1. In Google Cloud, enable on the project/key: **Maps JavaScript API**,
   **Places API (New)**, **Geocoding API**.
2. Restrict the key (HTTP referrers → your production domain + `localhost` for dev).
3. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

> The picker uses the **new** Places API surfaces (`AutocompleteSuggestion` /
> `Place.fetchFields`), so a freshly-issued key works — no legacy Places API needed.

## 7. Business contact details (public)

Used across the nav, footer, hero, contact and confirmation pages:
- `NEXT_PUBLIC_BUSINESS_PHONE` (e.g. `+9715XXXXXXXX`)
- `NEXT_PUBLIC_WHATSAPP_NUMBER` (digits only, e.g. `9715XXXXXXXX`)
- `NEXT_PUBLIC_BUSINESS_EMAIL`
- `NEXT_PUBLIC_INSTAGRAM_URL` — optional; the footer Instagram icon only renders
  when this is set (no dead links).
- `NEXT_PUBLIC_APP_URL` — the production origin; powers `metadataBase`, the
  sitemap, robots, and the OG image footer. **Set this to the real domain in prod.**

---

## Not used / cleanup notes

- **Maps**: the location picker now uses the **Google Maps JavaScript API** (see
  section 6 above) via `@googlemaps/js-api-loader`. The previous Leaflet +
  OpenStreetMap implementation and its `leaflet` / `@types/leaflet` deps have been
  removed.
- **Content-Security-Policy**: intentionally not set yet. The app uses inline
  `<script>` (pre-paint anim-gate + JSON-LD) and third-party GA/Sentry, so a CSP
  needs nonces/hashes to avoid breakage. Add via `headers()` in `next.config.ts`
  when ready to harden further.
- **About-page photos** use Unsplash stock (`images.unsplash.com` is allowlisted
  in `next.config.ts`). Replace with real Crescent photos before launch.
