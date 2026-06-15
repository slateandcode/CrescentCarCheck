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

  if (!name) return NextResponse.json({ ok: false, error: 'Name is required' }, { status: 422 })
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'Valid email is required' }, { status: 422 })
  }
  if (message.length < 10) {
    return NextResponse.json({ ok: false, error: 'Please write a longer message' }, { status: 422 })
  }

  const payload = {
    name,
    email,
    phone: body.phone?.trim(),
    topic: body.topic?.trim(),
    carMake: body.carMake?.trim() || undefined,
    carModel: body.carModel?.trim() || undefined,
    carYear: body.carYear?.trim() || undefined,
    message,
  }

  // Save first (so nothing is lost if email fails), then notify the owner.
  await saveContactMessage(payload)
  await notifyContactMessage(payload)

  return NextResponse.json({ ok: true })
}
