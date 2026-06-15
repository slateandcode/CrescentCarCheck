'use client'

import { useId, useState } from 'react'
import {
  Sparkles,
  ShieldCheck,
  MessageCircle,
  Phone,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { VehicleSelector } from '@/components/checkout/VehicleSelector'
import { cn } from '@/lib/utils'
import { trackEvent, GA_EVENTS } from '@/lib/analytics'

const EMIRATES = [
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Abu Dhabi',
  'Al Ain',
  'Ras Al Khaimah',
  'Fujairah',
] as const

const REASONS = [
  'Choosing a package',
  'Checking if this car is worth inspecting',
  'Asking about availability',
  'Other',
] as const

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '971502526314'

type Form = {
  name: string
  phone: string
  email: string
  carMake: string
  carModel: string
  carYear: string
  emirate: string
  listingUrl: string
  reason: string
  message: string
}

const EMPTY: Form = {
  name: '',
  phone: '',
  email: '',
  carMake: '',
  carModel: '',
  carYear: '',
  emirate: '',
  listingUrl: '',
  reason: REASONS[0],
  message: '',
}

type Errors = Partial<Record<keyof Form, string>>

function validate(form: Form): Errors {
  const e: Errors = {}
  if (!form.name.trim()) e.name = 'Please tell us your name'
  if (!form.phone.trim()) {
    e.phone = 'Phone or WhatsApp number is required'
  } else if (form.phone.replace(/\D/g, '').length < 9) {
    e.phone = 'Please enter a valid mobile number'
  }
  if (form.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(form.email.trim())) {
    e.email = 'Please enter a valid email address'
  }
  if (!form.carMake.trim()) e.carMake = 'Required'
  if (!form.carModel.trim()) e.carModel = 'Required'
  if (!form.carYear.trim()) e.carYear = 'Required'
  if (!form.emirate) e.emirate = 'Please select an emirate'
  if (form.listingUrl.trim() && !/^https?:\/\/\S+\.\S+/.test(form.listingUrl.trim())) {
    e.listingUrl = 'Must be a full URL (https://…)'
  }
  if (!form.message.trim()) e.message = 'A few words help us guide you'
  return e
}

function buildWhatsAppText(f: Form): string {
  const lines = [
    `Hi Crescent Car Check, I need help choosing the right inspection.`,
    ``,
    `Name: ${f.name}`,
    `Phone: ${f.phone}`,
    f.email && `Email: ${f.email}`,
    ``,
    `Car: ${f.carMake} ${f.carModel} ${f.carYear}`,
    `Emirate: ${f.emirate}`,
    f.listingUrl && `Listing: ${f.listingUrl}`,
    `Reason: ${f.reason}`,
    ``,
    `Details:`,
    f.message,
  ].filter(Boolean)
  return lines.join('\n')
}

const inputBase =
  'w-full rounded-input border bg-light-card text-light-text placeholder-light-text-muted ' +
  'px-3.5 py-2.5 text-sm transition-colors duration-150 ' +
  'focus:outline-none focus:border-accent focus:shadow-input-focus'

const labelClass = 'block text-xs font-semibold text-light-text-secondary uppercase tracking-wider mb-1.5'

interface FieldProps {
  id: string
  label: string
  required?: boolean
  optional?: boolean
  error?: string
  children: React.ReactNode
}

function Field({ id, label, required, optional, error, children }: FieldProps) {
  return (
    <div id={`field-${id}`}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required && <span className="text-error ml-1" aria-hidden="true">*</span>}
        {optional && <span className="text-light-text-muted ml-1 normal-case font-normal tracking-normal">(optional)</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-error text-xs mt-1.5">
          {error}
        </p>
      )}
    </div>
  )
}

export function PackageHelpForm() {
  const baseId = useId()
  const [form, setForm] = useState<Form>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  // Set when window.open() is blocked (popup blockers / in-app browsers): we keep
  // the form visible and render a manual "Open WhatsApp" link so the hand-off can
  // still complete instead of dead-ending on an unconditional success screen.
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null)

  const fid = (key: keyof Form) => `${baseId}-${key}`

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  // The shared VehicleSelector emits a patch (it can clear the model when the
  // make changes), so merge the whole object and clear any touched errors.
  const updateVehicle = (patch: { carMake?: string; carModel?: string; carYear?: string }) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setErrors((prev) => {
      const next = { ...prev }
      for (const k of Object.keys(patch) as (keyof Form)[]) delete next[k]
      return next
    })
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = validate(form)
    if (Object.keys(v).length) {
      setErrors(v)
      trackEvent(GA_EVENTS.CHECKOUT_FORM_ERROR, { form: 'package_help' })
      const firstKey = Object.keys(v)[0]
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      return
    }
    trackEvent(GA_EVENTS.CONTACT_SUBMITTED, { form: 'package_help', reason: form.reason })
    // Open WhatsApp pre-filled with their answers — works without a backend.
    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(buildWhatsAppText(form))}`
    // window.open() returns null when blocked (popup blockers / in-app browsers).
    // Only show the success state if the tab actually opened; otherwise keep the
    // form up and expose a manual link so the hand-off can still complete.
    const opened = window.open(url, '_blank', 'noopener,noreferrer')
    if (opened) {
      setFallbackUrl(null)
      setSubmitted(true)
    } else {
      setFallbackUrl(url)
    }
  }

  const askAgain = () => {
    setSubmitted(false)
    setForm(EMPTY)
    setErrors({})
    setFallbackUrl(null)
  }

  return (
    <section className="bg-background section-padding">
      <div className="container-wide">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-16 items-start">
          {/* Left: reassurance copy */}
          <div className="lg:sticky lg:top-28">
            <h2 className="text-display-sm md:text-display-md font-bold text-text-primary leading-tight">
              Not Sure? <span className="text-accent">Contact Us.</span>
            </h2>
            <p className="text-text-secondary text-base md:text-lg mt-4 leading-relaxed">
              Share the car details or seller listing and we&apos;ll help you choose the
              right inspection package.
            </p>

            <ul className="space-y-3 mt-7">
              {[
                'Independent advice based on the actual car you are looking at',
                'No pressure to upgrade — we tell you the minimum you really need',
                'Reply usually the same day, faster on WhatsApp',
              ].map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span className="text-text-secondary text-sm leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex items-center gap-2 text-sm text-text-muted">
              <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0" aria-hidden="true" />
              <span>No pressure, just guidance before you book.</span>
            </div>
          </div>

          {/* Right: form card */}
          <div className="relative">
            <div
              className="absolute -inset-3 bg-accent/10 rounded-card-lg blur-2xl pointer-events-none"
              aria-hidden="true"
            />
            <div className="relative bg-light-card rounded-card-lg border border-light-border p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              {submitted ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-full bg-success-muted flex items-center justify-center mx-auto">
                    <MessageCircle className="w-7 h-7 text-success" aria-hidden="true" />
                  </div>
                  <h3 className="text-light-text text-xl font-bold mt-4">
                    We&apos;ve opened WhatsApp for you
                  </h3>
                  <p className="text-light-text-secondary text-sm mt-2 max-w-md mx-auto leading-relaxed">
                    Your message is pre-filled with the car details you shared. Hit send
                    in WhatsApp and we&apos;ll reply with the package that fits.
                  </p>
                  <button
                    type="button"
                    onClick={askAgain}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:gap-2.5 transition-all duration-200 mt-6"
                  >
                    Ask about another car
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field id={fid('name')} label="Your name" required error={errors.name}>
                      <input
                        id={fid('name')}
                        type="text"
                        autoComplete="name"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        className={cn(inputBase, errors.name ? 'border-error' : 'border-light-border')}
                      />
                    </Field>

                    <Field id={fid('phone')} label="Phone / WhatsApp" required error={errors.phone}>
                      <input
                        id={fid('phone')}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="+971 50 000 0000"
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        className={cn(inputBase, errors.phone ? 'border-error' : 'border-light-border')}
                      />
                    </Field>

                    <Field id={fid('email')} label="Email" optional error={errors.email}>
                      <input
                        id={fid('email')}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        className={cn(inputBase, errors.email ? 'border-error' : 'border-light-border')}
                      />
                    </Field>

                    <Field id={fid('emirate')} label="Emirate / location" required error={errors.emirate}>
                      <select
                        id={fid('emirate')}
                        value={form.emirate}
                        onChange={(e) => update('emirate', e.target.value)}
                        className={cn(inputBase, 'appearance-none bg-[length:14px_14px] bg-no-repeat bg-[right_0.85rem_center] pr-9', errors.emirate ? 'border-error' : 'border-light-border')}
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
                        }}
                      >
                        <option value="">Select emirate</option>
                        {EMIRATES.map((em) => (
                          <option key={em} value={em}>
                            {em}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field id={fid('reason')} label="Reason for contacting" required>
                      <select
                        id={fid('reason')}
                        value={form.reason}
                        onChange={(e) => update('reason', e.target.value)}
                        className={cn(inputBase, 'appearance-none bg-[length:14px_14px] bg-no-repeat bg-[right_0.85rem_center] pr-9 border-light-border')}
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
                        }}
                      >
                        {REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="mt-4">
                    <p className="text-light-text font-bold text-sm mb-2">Vehicle</p>
                    <VehicleSelector
                      idPrefix={baseId}
                      make={form.carMake}
                      model={form.carModel}
                      year={form.carYear}
                      errors={{
                        carMake: errors.carMake,
                        carModel: errors.carModel,
                        carYear: errors.carYear,
                      }}
                      onChange={updateVehicle}
                    />
                  </div>

                  <div className="mt-4">
                    <Field id={fid('listingUrl')} label="Seller listing link" optional error={errors.listingUrl}>
                      <input
                        id={fid('listingUrl')}
                        type="url"
                        inputMode="url"
                        placeholder="https://dubizzle.com/…"
                        value={form.listingUrl}
                        onChange={(e) => update('listingUrl', e.target.value)}
                        className={cn(inputBase, errors.listingUrl ? 'border-error' : 'border-light-border')}
                      />
                    </Field>
                  </div>

                  <div className="mt-4">
                    <Field id={fid('message')} label="Message" required error={errors.message}>
                      <textarea
                        id={fid('message')}
                        rows={4}
                        placeholder="Tell us what the seller mentioned, any concerns, or paste details from the listing."
                        value={form.message}
                        onChange={(e) => update('message', e.target.value)}
                        className={cn(inputBase, 'resize-y min-h-[110px]', errors.message ? 'border-error' : 'border-light-border')}
                      />
                    </Field>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Button type="submit" size="lg" arrow fullWidth className="sm:w-auto">
                      <Sparkles className="w-4 h-4 mr-1" aria-hidden="true" />
                      Ask Which Package Fits
                    </Button>
                    <a
                      href={`tel:${process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+971 502526314'}`}
                      className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-light-text-secondary hover:text-light-text transition-colors duration-150"
                    >
                      <Phone className="w-4 h-4" aria-hidden="true" />
                      Or call us directly
                    </a>
                  </div>

                  {fallbackUrl && (
                    <div
                      role="alert"
                      className="mt-4 rounded-input border border-accent/40 bg-accent/5 px-3.5 py-3 text-sm text-light-text"
                    >
                      Your browser blocked the WhatsApp pop-up.{' '}
                      <a
                        href={fallbackUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-accent underline underline-offset-2"
                      >
                        Tap here to open WhatsApp
                      </a>{' '}
                      with your details pre-filled.
                    </div>
                  )}

                  <p className="text-light-text-muted text-xs mt-4 leading-relaxed">
                    Submitting opens WhatsApp with your details pre-filled — your message
                    only goes to us when you hit send there.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
