import { NextResponse } from 'next/server'
import { notifyContactMessage } from '@/lib/email'
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { clientIp, rateLimitOk } from '@/lib/rate-limit'

/** Saves the contact message so it's never lost if email delivery fails. Best-effort. */
async function saveContactMessage(msg: {
  name: string
  email: string
  phone?: string
  topic?: string
  carMake?: string
  carModel?: string
  carYear?: string
  message: string
}): Promise<void> {
  if (!isSupabaseConfigured()) return
  try {
    const { error } = await createServerClient()
      .from('contact_messages')
      .insert({
        name: msg.name,
        email: msg.email,
        phone: msg.phone || null,
        topic: msg.topic || null,
        car_make: msg.carMake || null,
        car_model: msg.carModel || null,
        car_year: msg.carYear || null,
        message: msg.message,
      })
    if (error) throw error
  } catch (err) {
    console.error('[contact] failed to save message (continuing to email)', err)
  }
}

interface ContactPayload {
  name?: string
  email?: string
  phone?: string
  topic?: string
  carMake?: string
  carModel?: string
  carYear?: string
  message?: string
}

/**
 * Known contact topics — must mirror the TOPICS list in
 * components/contact/ContactForm.tsx. An out-of-list topic (from a crafted POST)
 * is coerced to the first entry rather than stored/emailed verbatim. Kept here
 * (not imported) because that component is a client module; the values are stable.
 */
const TOPICS = [
  'General question',
  'Booking help',
  'Existing booking',
  'Partnerships',
  'Press / media',
  'Other',
] as const
const DEFAULT_TOPIC = TOPICS[0]

/**
 * Max lengths for customer-supplied strings. The DB columns are unbounded `text`,
 * so without these a crafted POST could store arbitrarily large values. Generous
 * enough for any legitimate message; the form UI never approaches them.
 */
const MAX_LEN = {
  name: 120,
  email: 200,
  phone: 32,
  carMake: 80,
  carModel: 80,
  carYear: 4,
  message: 5000,
} as const

/**
 * Contact form handler.
 *  1. Validate input
 *  2. Forward to the owner inbox via Resend (best-effort, env-gated)
 *
 * Returns success once the message is accepted. While Resend isn't configured,
 * notifyContactMessage() logs and no-ops, so the form works in every environment.
 */
export async function POST(req: Request) {
  // Anti-abuse: cap contact submissions per IP (each accepted message hits the
  // owner inbox + the shared DB). Fails open if the limiter is unavailable.
  if (!(await rateLimitOk(`contact:${clientIp(req)}`, 5, 60))) {
    return NextResponse.json(
      { ok: false, error: 'Too many messages. Please wait a minute and try again.' },
      { status: 429 },
    )
  }

  let body: ContactPayload
  try {
    body = (await req.json()) as ContactPayload
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const name = body.name?.trim() ?? ''
  const email = body.email?.trim() ?? ''
  const message = body.message?.trim() ?? ''
  const phone = body.phone?.trim() ?? ''
  const carMake = body.carMake?.trim() ?? ''
  const carModel = body.carModel?.trim() ?? ''
  const carYear = body.carYear?.trim() ?? ''
  const topicRaw = body.topic?.trim() ?? ''

  if (!name) return NextResponse.json({ ok: false, error: 'Name is required' }, { status: 422 })
  if (name.length > MAX_LEN.name) {
    return NextResponse.json({ ok: false, error: 'Name is too long' }, { status: 422 })
  }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) || email.length > MAX_LEN.email) {
    return NextResponse.json({ ok: false, error: 'Valid email is required' }, { status: 422 })
  }
  if (phone.length > MAX_LEN.phone) {
    return NextResponse.json({ ok: false, error: 'Phone number is too long' }, { status: 422 })
  }
  if (carMake.length > MAX_LEN.carMake || carModel.length > MAX_LEN.carModel || carYear.length > MAX_LEN.carYear) {
    return NextResponse.json({ ok: false, error: 'Vehicle details are too long' }, { status: 422 })
  }
  if (message.length < 10) {
    return NextResponse.json({ ok: false, error: 'Please write a longer message' }, { status: 422 })
  }
  if (message.length > MAX_LEN.message) {
    return NextResponse.json({ ok: false, error: 'Please shorten your message' }, { status: 422 })
  }

  // Coerce an unknown/missing topic to the default rather than storing/emailing a
  // crafted value verbatim.
  const topic = (TOPICS as readonly string[]).includes(topicRaw) ? topicRaw : DEFAULT_TOPIC

  const payload = {
    name,
    email,
    phone: phone || undefined,
    topic,
    carMake: carMake || undefined,
    carModel: carModel || undefined,
    carYear: carYear || undefined,
    message,
  }

  // Save first (so nothing is lost if email fails), then notify the owner.
  await saveContactMessage(payload)
  await notifyContactMessage(payload)

  return NextResponse.json({ ok: true })
}
