import { getResend, isResendConfigured } from '@/lib/resend'
import { slotLabel } from '@/lib/packages'
import type { BookingRecord } from '@/types/booking'

/**
 * Transactional email layer (server-only).
 *
 * Every function here is BEST-EFFORT and never throws: if Resend isn't
 * configured yet, or a send fails, we log and resolve. Booking persistence is
 * the source of truth — email is a notification on top of it, so a mail hiccup
 * must never fail the user's request.
 *
 * Activate by setting RESEND_API_KEY (+ RESEND_FROM_EMAIL, BUSINESS_OWNER_EMAIL).
 */

const OWNER_EMAIL = process.env.BUSINESS_OWNER_EMAIL || ''

/** Resend wants either "email" or "Name <email>". Normalise to the branded form. */
function fromAddress(): string {
  const raw = process.env.RESEND_FROM_EMAIL || 'bookings@crescentcarcheck.com'
  return raw.includes('<') ? raw : `Crescent Car Check <${raw}>`
}

/**
 * Resend's SDK has no client-side timeout, so a stalled socket would hang the
 * awaiting request until the serverless platform kills the whole function —
 * failing the user's request even when the work is best-effort. Cap every send
 * so a mail-provider stall can't exceed the function budget; callers still
 * try/catch around this, so a timeout just logs and resolves like any other
 * send failure.
 */
const SEND_TIMEOUT_MS = 8000
type SendPayload = Parameters<ReturnType<typeof getResend>['emails']['send']>[0]
async function sendEmail(payload: SendPayload): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('resend send timed out')), SEND_TIMEOUT_MS)
  })
  const send = getResend().emails.send(payload)
  // If the timeout wins the race the send promise is abandoned; swallow any late
  // rejection so a delayed socket error can't surface as an unhandled rejection.
  send.catch(() => {})
  try {
    await Promise.race([send, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#0A0A0A;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;font-weight:700;font-size:18px;">
      <span style="color:#FFC600;">Crescent</span> Car Check
    </div>
    <div style="background:#fff;padding:24px;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 12px 12px;">
      <h1 style="font-size:20px;margin:0 0 16px;">${esc(title)}</h1>
      ${bodyHtml}
    </div>
    <p style="color:#a1a1aa;font-size:12px;text-align:center;margin-top:16px;">
      Crescent Car Check · Pre-purchase car inspections across the UAE
    </p>
  </div></body></html>`
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 12px 6px 0;color:#71717a;font-size:13px;vertical-align:top;white-space:nowrap;">${esc(label)}</td>
    <td style="padding:6px 0;font-size:14px;font-weight:600;">${value}</td>
  </tr>`
}

function bookingTable(record: BookingRecord): string {
  // Coerce to finite numbers before interpolating into the href. The API uses a
  // type-assertion (not runtime validation), so these could arrive as arbitrary
  // JSON; forcing them to real numbers makes HTML/URL injection impossible.
  const lat = Number(record.locationLat)
  const lng = Number(record.locationLng)
  const hasCoords =
    record.locationLat != null &&
    record.locationLng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
  const mapLink = hasCoords
    ? `<a href="https://www.google.com/maps?q=${lat},${lng}" style="color:#a16207;">Open in Maps</a>`
    : ''
  const paymentText =
    record.paymentStatus === 'paid'
      ? `Paid — AED ${record.totalPrice}`
      : `${record.paymentStatus} — AED ${record.totalPrice}`
  return `<table style="width:100%;border-collapse:collapse;">
    ${row('Reference', esc(record.id))}
    ${row('Package', `${esc(record.packageName)} — AED ${record.packagePrice}`)}
    ${record.travelFee > 0 ? row('Travel fee', `AED ${record.travelFee} (${esc(record.emirate)})`) : ''}
    ${row('Total paid', `AED ${record.totalPrice}`)}
    ${row('Payment', esc(paymentText))}
    ${row('Name', esc(record.customerName))}
    ${row('Phone', esc(record.customerPhone))}
    ${row('Email', esc(record.customerEmail || '—'))}
    ${row('Vehicle', esc(`${record.carMake} ${record.carModel} (${record.carYear})`))}
    ${record.vin ? row('VIN', esc(record.vin)) : ''}
    ${record.plateNumber ? row('Plate', esc(record.plateNumber)) : ''}
    ${row('Emirate', esc(record.emirate))}
    ${row('Parking', esc(record.parkingType ?? '—'))}
    ${row('Address', `${esc(record.address)} ${mapLink}`)}
    ${row('Date', esc(record.inspectionDate))}
    ${row('Slot', esc(slotLabel(record.slotTime)))}
    ${record.additionalNotes ? row('Notes', esc(record.additionalNotes)) : ''}
  </table>`
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '971502526314'
const BUSINESS_PHONE = process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+971 502526314'

/**
 * Sent ONLY after Stripe confirms payment (from the webhook). Emails the owner a
 * paid-booking alert and, if the customer shared an email, a confirmation.
 * Safe to await — never throws.
 */
export async function notifyPaidBooking(record: BookingRecord): Promise<void> {
  if (!isResendConfigured()) {
    console.log('[email] Resend not configured — skipping booking notifications', {
      id: record.id,
    })
    return
  }

  const from = fromAddress()

  // 1) Owner alert
  if (OWNER_EMAIL) {
    try {
      await sendEmail({
        from,
        to: OWNER_EMAIL,
        replyTo: record.customerEmail || undefined,
        subject: `PAID booking ${record.id} — ${record.packageName} (${record.emirate})`,
        html: layout(
          'New paid inspection request',
          `<p style="font-size:14px;color:#3f3f46;margin:0 0 16px;">A booking was just paid and is awaiting time confirmation:</p>${bookingTable(record)}`,
        ),
      })
    } catch (err) {
      console.error('[email] owner booking alert failed', err)
    }
  } else {
    console.warn('[email] BUSINESS_OWNER_EMAIL not set — owner alert skipped')
  }

  // 2) Customer confirmation (only if they shared an email)
  if (record.customerEmail) {
    try {
      await sendEmail({
        from,
        to: record.customerEmail,
        subject: `Payment received — your inspection request (${record.id})`,
        html: layout(
          `Thanks, ${esc(record.customerName.split(' ')[0] || 'there')}!`,
          `<p style="font-size:14px;color:#3f3f46;margin:0 0 16px;">
             Your inspection booking is confirmed for your selected slot. Our team will contact
             you on WhatsApp to confirm the exact arrival timing.
           </p>
           <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">
             ${row('Reference', esc(record.id))}
             ${row('Package', `${esc(record.packageName)} — AED ${record.packagePrice}`)}
             ${row('Amount paid', `AED ${record.totalPrice}`)}
             ${row('Date', esc(record.inspectionDate))}
             ${row('Slot', esc(slotLabel(record.slotTime)))}
           </table>
           <p style="font-size:14px;color:#3f3f46;margin:0;">
             Questions? WhatsApp us on
             <a href="https://wa.me/${esc(WHATSAPP_NUMBER)}" style="color:#a16207;">${esc(BUSINESS_PHONE)}</a>.
           </p>`,
        ),
      })
    } catch (err) {
      console.error('[email] customer confirmation failed', err)
    }
  }
}

/**
 * Owner alert for the rare case where a payment completes AFTER its slot hold was
 * already released (customer paid on a stale Checkout session once the 30-minute
 * hold had expired and the slot was freed). The webhook refunds the charge
 * automatically; this notifies the owner so they can follow up with the customer.
 * Best-effort — never throws.
 */
export async function notifyLatePaymentRefund(
  record: BookingRecord,
  paymentIntentId: string | null,
): Promise<void> {
  if (!isResendConfigured()) {
    console.log('[email] Resend not configured — skipping late-payment alert', { id: record.id })
    return
  }
  if (!OWNER_EMAIL) {
    console.warn('[email] BUSINESS_OWNER_EMAIL not set — late-payment alert skipped')
    return
  }
  try {
    await sendEmail({
      from: fromAddress(),
      to: OWNER_EMAIL,
      replyTo: record.customerEmail || undefined,
      subject: `ACTION: late payment auto-refunded — ${record.id} (${record.emirate})`,
      html: layout(
        'Late payment auto-refunded',
        `<p style="font-size:14px;color:#3f3f46;margin:0 0 16px;">
           A customer completed payment for booking <strong>${esc(record.id)}</strong> after its
           slot hold had already been released, so the slot was no longer reserved. The charge
           ${paymentIntentId ? `(${esc(paymentIntentId)}) ` : ''}has been refunded automatically.
           Get in touch if they'd still like to book.
         </p>${bookingTable(record)}`,
      ),
    })
  } catch (err) {
    console.error('[email] late-payment alert failed', err)
  }
}

export interface ContactMessage {
  name: string
  email: string
  phone?: string
  topic?: string
  carMake?: string
  carModel?: string
  carYear?: string
  message: string
}

/**
 * Forwards a contact-form submission to the owner inbox. Never throws; instead
 * reports its outcome so the route can tell a genuine delivery failure ('failed')
 * apart from "no mail backend configured yet" ('skipped') and not show the
 * customer a false "Message sent".
 */
export async function notifyContactMessage(msg: ContactMessage): Promise<'ok' | 'skipped' | 'failed'> {
  if (!isResendConfigured()) {
    console.log('[email] Resend not configured — skipping contact notification')
    return 'skipped'
  }
  if (!OWNER_EMAIL) {
    console.warn('[email] BUSINESS_OWNER_EMAIL not set — contact notification skipped')
    return 'skipped'
  }

  const vehicle = [msg.carMake, msg.carModel, msg.carYear].filter(Boolean).join(' ').trim()

  try {
    await sendEmail({
      from: fromAddress(),
      to: OWNER_EMAIL,
      replyTo: msg.email,
      subject: `Contact form: ${msg.topic || 'General'} — ${msg.name}`,
      html: layout(
        'New contact message',
        `<table style="width:100%;border-collapse:collapse;">
           ${row('Name', esc(msg.name))}
           ${row('Email', esc(msg.email))}
           ${row('Phone', esc(msg.phone || '—'))}
           ${row('Topic', esc(msg.topic || 'General'))}
           ${vehicle ? row('Vehicle', esc(vehicle)) : ''}
         </table>
         <p style="font-size:14px;color:#3f3f46;margin:16px 0 0;white-space:pre-wrap;">${esc(msg.message)}</p>`,
      ),
    })
    return 'ok'
  } catch (err) {
    console.error('[email] contact notification failed', err)
    return 'failed'
  }
}
