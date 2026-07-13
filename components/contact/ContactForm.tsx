'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Field, inputBase, selectClass, selectChevronStyle, fieldBorder } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { VehicleSelector } from '@/components/checkout/VehicleSelector'
import { trackEvent, GA_EVENTS } from '@/lib/analytics'

const TOPICS = [
  'General question',
  'Booking help',
  'Existing booking',
  'Partnerships',
  'Press / media',
  'Other',
] as const

type Form = {
  name: string
  email: string
  phone: string
  topic: string
  carMake: string
  carModel: string
  carYear: string
  message: string
}

type Errors = Partial<Record<keyof Form, string>>

const EMPTY: Form = {
  name: '',
  email: '',
  phone: '',
  topic: TOPICS[0],
  carMake: '',
  carModel: '',
  carYear: '',
  message: '',
}

function validate(form: Form): Errors {
  const e: Errors = {}
  if (!form.name.trim()) e.name = 'Please tell us your name'
  if (!form.email.trim()) {
    e.email = 'Email is required so we can reply'
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(form.email.trim())) {
    e.email = 'Please enter a valid email address'
  }
  if (form.phone.trim() && form.phone.replace(/\D/g, '').length < 9) {
    e.phone = 'Please enter a valid mobile number'
  }
  if (!form.message.trim()) {
    e.message = 'A short note helps us reply better'
  } else if (form.message.trim().length < 10) {
    e.message = 'A few more words please'
  }
  return e
}

export function ContactForm() {
  const baseId = useId()
  const router = useRouter()
  const [form, setForm] = useState<Form>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const id = (k: keyof Form) => `${baseId}-${k}`

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  // The shared VehicleSelector emits a patch (it can clear model when make
  // changes), so merge the whole object rather than a single key.
  const updateVehicle = (patch: { carMake?: string; carModel?: string; carYear?: string }) => {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const v = validate(form)
    if (Object.keys(v).length) {
      setErrors(v)
      const firstKey = Object.keys(v)[0]
      document.getElementById(`field-${id(firstKey as keyof Form)}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setSubmitting(false)
        setSubmitError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      trackEvent(GA_EVENTS.CONTACT_SUBMITTED, { form: 'contact', topic: form.topic })
      // Redirect to the dedicated thank-you page (Google Ads counts its page
      // views as form-lead conversions). Leave `submitting` true so the button
      // stays in its loading state until the navigation completes.
      router.push('/thank-you')
    } catch {
      setSubmitting(false)
      setSubmitError('Network error. Please check your connection and try again.')
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {submitError && (
        <div
          className="mb-4 rounded-card border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id={id('name')} label="Your name" required error={errors.name}>
          <input
            id={id('name')}
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className={cn(inputBase, fieldBorder(errors.name))}
          />
        </Field>

        <Field id={id('email')} label="Email" required error={errors.email}>
          <input
            id={id('email')}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className={cn(inputBase, fieldBorder(errors.email))}
          />
        </Field>

        <Field id={id('phone')} label="Phone / WhatsApp" optional error={errors.phone}>
          <input
            id={id('phone')}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+971 50 000 0000"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className={cn(inputBase, fieldBorder(errors.phone))}
          />
        </Field>

        <Field id={id('topic')} label="What's it about?" required>
          <select
            id={id('topic')}
            value={form.topic}
            onChange={(e) => update('topic', e.target.value)}
            className={cn(selectClass, fieldBorder(undefined))}
            style={selectChevronStyle}
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-6">
        <p className="text-light-text font-bold text-sm">
          About the vehicle{' '}
          <span className="text-light-text-muted font-normal">(optional)</span>
        </p>
        <p className="text-light-text-muted text-xs mt-1 mb-3">
          Asking about a specific car? Add it so we can advise faster.
        </p>
        <VehicleSelector
          idPrefix={baseId}
          make={form.carMake}
          model={form.carModel}
          year={form.carYear}
          errors={{}}
          onChange={updateVehicle}
          required={false}
        />
      </div>

      <div className="mt-4">
        <Field id={id('message')} label="Your message" required error={errors.message}>
          <textarea
            id={id('message')}
            rows={5}
            placeholder="Tell us how we can help. The more detail, the better the answer."
            value={form.message}
            onChange={(e) => update('message', e.target.value)}
            className={cn(inputBase, 'resize-y min-h-[130px]', fieldBorder(errors.message))}
          />
        </Field>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <p className="text-light-text-muted text-xs leading-relaxed max-w-sm">
          We reply within a few hours on weekdays. Faster via WhatsApp.
        </p>
        <Button type="submit" size="lg" loading={submitting} className="sm:min-w-[200px]">
          {submitting ? 'Sending…' : (
            <>
              <Send className="w-4 h-4 mr-1" aria-hidden="true" />
              Send Message
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
