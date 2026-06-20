'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShieldCheck, Car, MapPin, Calendar, User, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Field, inputBase, selectClass, selectChevronStyle, fieldBorder } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { PACKAGES, travelFeeForEmirate, distanceClassForEmirate } from '@/lib/packages'
import { validateForm } from '@/lib/validation'
import { trackEvent, GA_EVENTS } from '@/lib/analytics'
import { VehicleSelector } from './VehicleSelector'
import { ScheduleSlot } from './ScheduleSlot'
import { PackageSummary } from './PackageSummary'
import { LocationMap } from './LocationMap'
import type { BookingFormData, BookingFormErrors, Emirate, PackageId, ParkingType } from '@/types/booking'

// Ordered: no-fee emirates first, then the ones carrying a flat travel fee.
const EMIRATES: Emirate[] = [
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Abu Dhabi',
  'Al Ain',
  'Ras Al Khaimah',
  'Fujairah',
]

const PARKING_OPTIONS: { value: ParkingType; label: string; hint: string }[] = [
  { value: 'showroom', label: 'Showroom', hint: 'Dealer or used-car lot' },
  { value: 'outdoor', label: 'Outdoor parking', hint: 'Street or open lot' },
  { value: 'home', label: 'Seller’s home', hint: 'Residential building or villa' },
]

function emptyForm(packageId: PackageId): BookingFormData {
  return {
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    emirate: '',
    address: '',
    locationLat: null,
    locationLng: null,
    parkingType: '',
    carMake: '',
    carModel: '',
    carYear: '',
    additionalNotes: '',
    inspectionDate: '',
    slotTime: '',
    packageId,
  }
}

function isValidPackageId(s: string): s is PackageId {
  return s === 'standard' || s === 'comprehensive' || s === 'premium'
}

// Stripe Checkout is a full-page redirect, so a cancelled payment lands back on a
// freshly-mounted /checkout with an empty form. Stash the form before redirecting
// and restore it on the cancelled return so the user doesn't re-type everything.
const FORM_STORAGE_KEY = 'ccc-checkout-form'

export function CheckoutForm() {
  const search = useSearchParams()
  const baseId = useId()

  const initialPackageId: PackageId = useMemo(() => {
    const p = search.get('package') ?? ''
    return isValidPackageId(p) ? p : 'comprehensive'
  }, [search])

  const [form, setForm] = useState<BookingFormData>(() => emptyForm(initialPackageId))
  const [errors, setErrors] = useState<BookingFormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Bumped to force ScheduleSlot to re-check availability (e.g. after a 409).
  const [availabilityRefresh, setAvailabilityRefresh] = useState(0)

  const pkg = PACKAGES.find((p) => p.id === form.packageId) ?? PACKAGES[1]
  const travelFee = travelFeeForEmirate(form.emirate)
  const distance = distanceClassForEmirate(form.emirate)
  const total = pkg.price + travelFee
  const paymentCancelled = search.get('cancelled') === '1'

  const id = (k: string) => `${baseId}-${k}`

  // Restore the saved form after a cancelled Stripe redirect; otherwise clear any
  // stale draft so a fresh visit always starts empty. Read the cancelled flag from
  // window.location directly (not the reactive searchParams): /checkout is
  // statically prerendered, so useSearchParams() is empty on the first client
  // render and would mis-fire this. Deferred to a task so we never call setState
  // synchronously in the effect body (repo lint rule) and so it runs post-hydration.
  useEffect(() => {
    const t = setTimeout(() => {
      const cancelled = new URLSearchParams(window.location.search).get('cancelled') === '1'
      if (!cancelled) {
        try {
          sessionStorage.removeItem(FORM_STORAGE_KEY)
        } catch {}
        return
      }
      try {
        const raw = sessionStorage.getItem(FORM_STORAGE_KEY)
        if (!raw) return
        const saved = JSON.parse(raw) as Partial<BookingFormData>
        // Keep the package from the URL (the cancel link carries it); restore the rest.
        setForm((prev) => ({ ...prev, ...saved, packageId: prev.packageId }))
      } catch {}
    }, 0)
    return () => clearTimeout(t)
  }, [])

  const update = (patch: Partial<BookingFormData>) => {
    setForm((prev) => ({ ...prev, ...patch }))
    // Clear errors for touched fields.
    setErrors((prev) => {
      const next = { ...prev }
      for (const k of Object.keys(patch) as (keyof BookingFormData)[]) {
        delete next[k]
      }
      return next
    })
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const v = validateForm(form)
    if (Object.keys(v).length) {
      setErrors(v)
      trackEvent(GA_EVENTS.CHECKOUT_FORM_ERROR, { form: 'checkout' })
      // Map validation key to our prefixed DOM id format.
      const firstKey = Object.keys(v)[0]
      const el = document.getElementById(`field-${baseId}-${firstKey}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.querySelector<HTMLElement>('input, select, textarea, button')?.focus()
      }
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        checkoutUrl?: string
        bookingId?: string
        error?: string
        errors?: BookingFormErrors
      }

      // 422 = server-side field validation rejected the payload (the server runs
      // the same validateForm). Surface the per-field errors and jump to the
      // first one, mirroring the local-validation path above, instead of showing
      // a generic banner.
      if (res.status === 422 && data.errors && typeof data.errors === 'object') {
        setSubmitting(false)
        setErrors(data.errors)
        const firstKey = Object.keys(data.errors)[0]
        if (firstKey) {
          const el = document.getElementById(`field-${baseId}-${firstKey}`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el.querySelector<HTMLElement>('input, select, textarea, button')?.focus()
          }
        }
        return
      }

      // 409 = the slot was taken between our availability check and submit.
      if (res.status === 409) {
        setSubmitting(false)
        setSubmitError(
          'That slot was just booked. Please choose another time or WhatsApp us for help.',
        )
        // Clear the now-invalid slot and re-check availability for the date.
        update({ slotTime: '' })
        setAvailabilityRefresh((n) => n + 1)
        return
      }

      if (!res.ok || !data.ok || !data.checkoutUrl) {
        setSubmitting(false)
        setSubmitError(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      trackEvent(GA_EVENTS.CHECKOUT_SUBMITTED, { package: form.packageId })
      // Save the form so a cancelled payment can restore it (see the mount effect).
      try {
        sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(form))
      } catch {}
      // Hand off to Stripe Checkout. Keep `submitting` true through the redirect
      // so the button stays disabled.
      window.location.href = data.checkoutUrl
    } catch {
      setSubmitting(false)
      setSubmitError('Network error. Please check your connection and try again.')
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-8 lg:gap-10 items-start">
        {/* Left: form sections */}
        <div className="space-y-10 min-w-0">
          {paymentCancelled && (
            <div
              className="rounded-card border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-light-text"
              role="status"
            >
              Payment was cancelled — your booking isn&apos;t confirmed yet. Your details are
              still here; review them and tap <strong>Pay &amp; Book Inspection</strong> when
              you&apos;re ready.
            </div>
          )}

          {/* Vehicle */}
          <section aria-labelledby="vehicle-heading">
            <SectionHeading icon={Car} step="1" id="vehicle-heading" title="The Car" hint="Tell us which vehicle we'll be inspecting." />
            <VehicleSelector
              idPrefix={baseId}
              make={form.carMake}
              model={form.carModel}
              year={form.carYear}
              errors={{ carMake: errors.carMake, carModel: errors.carModel, carYear: errors.carYear }}
              onChange={update}
            />
          </section>

          {/* Location */}
          <section aria-labelledby="location-heading">
            <SectionHeading icon={MapPin} step="2" id="location-heading" title="Where Is the Car?" hint="Search for the address or drag the pin to the exact spot." />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id={id('emirate')} label="Emirate" required error={errors.emirate}>
                <select
                  id={id('emirate')}
                  value={form.emirate}
                  onChange={(e) => update({ emirate: e.target.value as Emirate })}
                  className={cn(selectClass, fieldBorder(errors.emirate))}
                  style={selectChevronStyle}
                >
                  <option value="">Select emirate</option>
                  {EMIRATES.map((em) => {
                    const fee = travelFeeForEmirate(em)
                    return (
                      <option key={em} value={em}>
                        {em}
                        {fee ? ` (+AED ${fee} travel)` : ''}
                      </option>
                    )
                  })}
                </select>
              </Field>

              <Field id={id('parkingType')} label="Where is it parked?" required error={errors.parkingType}>
                <select
                  id={id('parkingType')}
                  value={form.parkingType}
                  onChange={(e) => update({ parkingType: e.target.value as ParkingType })}
                  className={cn(selectClass, fieldBorder(errors.parkingType))}
                  style={selectChevronStyle}
                >
                  <option value="">Select parking type</option>
                  {PARKING_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label} — {p.hint}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-4">
              <LocationMap
                onChange={(coords, addr) =>
                  update({
                    locationLat: coords.lat,
                    locationLng: coords.lng,
                    address: addr || form.address,
                  })
                }
              />
            </div>

            <div className="mt-4">
              <Field id={id('address')} label="Address (as you'd give it to a driver)" required error={errors.address}>
                <textarea
                  id={id('address')}
                  rows={2}
                  placeholder="Building, street, area, landmark…"
                  value={form.address}
                  onChange={(e) => update({ address: e.target.value })}
                  className={cn(inputBase, 'resize-y min-h-[64px]', fieldBorder(errors.address))}
                />
              </Field>
            </div>
          </section>

          {/* Schedule */}
          <section aria-labelledby="schedule-heading">
            <SectionHeading icon={Calendar} step="3" id="schedule-heading" title="When Should We Come?" hint="Pick a date and time slot — our team will confirm the exact arrival timing by WhatsApp, and we'll do our best to fit in same-day requests." />
            <ScheduleSlot
              idPrefix={baseId}
              inspectionDate={form.inspectionDate}
              slotTime={form.slotTime}
              distance={distance}
              errors={{ inspectionDate: errors.inspectionDate, slotTime: errors.slotTime }}
              onChange={update}
              refreshKey={availabilityRefresh}
            />
          </section>

          {/* Contact */}
          <section aria-labelledby="contact-heading">
            <SectionHeading icon={User} step="4" id="contact-heading" title="Your Details" hint="So we can send the report and reach you with any questions." />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id={id('customerName')} label="Full name" required error={errors.customerName}>
                <input
                  id={id('customerName')}
                  type="text"
                  autoComplete="name"
                  value={form.customerName}
                  onChange={(e) => update({ customerName: e.target.value })}
                  className={cn(inputBase, fieldBorder(errors.customerName))}
                />
              </Field>

              <Field id={id('customerPhone')} label="Phone / WhatsApp" required error={errors.customerPhone}>
                <input
                  id={id('customerPhone')}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+971 50 000 0000"
                  value={form.customerPhone}
                  onChange={(e) => update({ customerPhone: e.target.value })}
                  className={cn(inputBase, fieldBorder(errors.customerPhone))}
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field id={id('customerEmail')} label="Email" optional error={errors.customerEmail} hint="We'll send the digital report here.">
                <input
                  id={id('customerEmail')}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.customerEmail}
                  onChange={(e) => update({ customerEmail: e.target.value })}
                  className={cn(inputBase, fieldBorder(errors.customerEmail))}
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field id={id('additionalNotes')} label="Anything we should know?" optional>
                <textarea
                  id={id('additionalNotes')}
                  rows={3}
                  placeholder="Specific concerns, seller's contact, gate code, etc."
                  value={form.additionalNotes}
                  onChange={(e) => update({ additionalNotes: e.target.value })}
                  className={cn(inputBase, 'resize-y min-h-[90px]', fieldBorder(undefined))}
                />
              </Field>
            </div>
          </section>

          {/* Submit (mobile shows summary above this on small screens) */}
          <div className="lg:hidden">
            <PackageSummary pkg={pkg} emirate={form.emirate} travelFee={travelFee} />
          </div>

          <div className="border-t border-light-border pt-6">
            {submitError && (
              <div className="mb-4 rounded-card border border-error/30 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
                {submitError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <p className="text-light-text-muted text-xs leading-relaxed max-w-sm flex items-start gap-1.5">
                <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                Payment secures your inspection request. We&apos;ll message you to confirm the
                exact arrival time.
              </p>
              <Button
                type="submit"
                size="lg"
                loading={submitting}
                className="sm:min-w-[260px]"
              >
                {submitting ? 'Redirecting to payment…' : 'Pay & Book Inspection'}
              </Button>
            </div>

            <p className="text-light-text-muted text-xs mt-4 sm:text-right flex items-center sm:justify-end gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              AED {total}
              {travelFee > 0 ? ` (incl. AED ${travelFee} travel)` : ''} — paid securely with
              Stripe. You&apos;ll be redirected to complete payment.
            </p>
          </div>
        </div>

        {/* Right: sticky summary (desktop only) */}
        <div className="hidden lg:block lg:sticky lg:top-24">
          <PackageSummary pkg={pkg} emirate={form.emirate} travelFee={travelFee} />
        </div>
      </div>
    </form>
  )
}

interface SectionHeadingProps {
  icon: typeof Car
  step: string
  id: string
  title: string
  hint: string
}

function SectionHeading({ icon: Icon, step, id, title, hint }: SectionHeadingProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 grid place-items-center"
        >
          <Icon className="w-4 h-4 text-accent" />
        </span>
        <div>
          <p className="text-xs font-semibold text-light-text-muted uppercase tracking-wider">
            Step {step}
          </p>
          <h2 id={id} className="text-light-text font-bold text-lg sm:text-xl leading-tight">
            {title}
          </h2>
        </div>
      </div>
      <p className="text-light-text-secondary text-sm mt-2">{hint}</p>
    </div>
  )
}
