'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, MessageCircle, Clock, BadgeCheck } from 'lucide-react'
import { trackEvent, GA_EVENTS } from '@/lib/analytics'

// WhatsApp target for the discount claim. Same number as the floating button.
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '971502526314'
const CLAIM_MESSAGE =
  "Hi Crescent Car Check, I'd like to claim AED 50 off the Premium Package. I understand payment is required within 48 hours to secure this discount."

// Client-supplied discount banner (landscape: logo + car + sample report).
const POPUP_IMAGE = '/discount-popup.jpg'

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000
// Persist the countdown deadline so it keeps ticking across page navigations and
// refreshes instead of restarting at 48:00:00 every visit.
const DEADLINE_STORAGE_KEY = 'ccc_discount_deadline'

/**
 * Returns the persisted countdown deadline, or creates a fresh 48h one. The
 * deadline is stored in localStorage so a buyer who lands on the home page,
 * navigates away, and comes back sees the same offer continuing to count down
 * rather than a reset timer. A lapsed (or missing/corrupt) deadline starts a new
 * 48h window so the offer always shows live urgency. Runs client-side only.
 */
function loadOrCreateDeadline() {
  const now = Date.now()
  try {
    const stored = window.localStorage.getItem(DEADLINE_STORAGE_KEY)
    if (stored) {
      const parsed = Number(stored)
      if (Number.isFinite(parsed) && parsed > now) return parsed
    }
  } catch {
    // localStorage may be unavailable (private mode, blocked cookies) — fall
    // through and use an in-memory deadline for this visit.
  }
  const deadline = now + FORTY_EIGHT_HOURS_MS
  try {
    window.localStorage.setItem(DEADLINE_STORAGE_KEY, String(deadline))
  } catch {
    // Ignore write failures; the timer still works for the current session.
  }
  return deadline
}

/** Whole hours/minutes/seconds left until `deadline` (never negative). */
function remaining(deadline: number) {
  const ms = Math.max(0, deadline - Date.now())
  const total = Math.floor(ms / 1000)
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="min-w-[3rem] rounded-lg border border-border bg-surface px-2 py-1.5 text-center text-2xl font-black tabular-nums text-text-primary">
        {pad(value)}
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </span>
    </div>
  )
}

/**
 * Discount lead-gen pop-up shown on every home-page load (brief item 12). Promotes
 * AED 50 off the Premium inspection and hands off to WhatsApp with a pre-filled
 * claim message. Modeled on InspectionVideoModal: portal, Esc/backdrop close,
 * body scroll-lock and focus trap. The 48h countdown is client-side urgency,
 * persisted across visits via localStorage so it keeps ticking down.
 */
export function DiscountPopup() {
  // Gate on a mounted flag so nothing renders during SSR (avoids hydration
  // mismatch from the live countdown and the document portal target).
  const [open, setOpen] = useState(false)
  const [time, setTime] = useState(() => ({ hours: 47, minutes: 59, seconds: 59 }))
  const dialogRef = useRef<HTMLDivElement>(null)
  const deadlineRef = useRef<number>(0)

  useEffect(() => {
    deadlineRef.current = loadOrCreateDeadline()
    setTime(remaining(deadlineRef.current))
    setOpen(true)
    trackEvent(GA_EVENTS.DISCOUNT_POPUP_SHOWN)
  }, [])

  useEffect(() => {
    if (!open) return

    document.body.classList.add('overflow-hidden')
    dialogRef.current?.querySelector<HTMLElement>('button, a[href]')?.focus()

    const tick = setInterval(() => setTime(remaining(deadlineRef.current)), 1000)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      clearInterval(tick)
      document.body.classList.remove('overflow-hidden')
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleClaim = () => {
    trackEvent(GA_EVENTS.DISCOUNT_CLAIMED)
    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(CLAIM_MESSAGE)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AED 50 off Premium Inspection"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-card-lg border border-border bg-background shadow-glow animate-scale-in focus:outline-none"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close offer"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="relative aspect-[16/9] w-full">
          <Image
            src={POPUP_IMAGE}
            alt="Crescent Car Check — premium pre-purchase car inspection in Dubai"
            fill
            sizes="(max-width: 640px) 100vw, 448px"
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>

        <div className="px-6 pb-6 -mt-6 relative">
          <h2 className="text-2xl font-black leading-tight text-text-primary">
            Get <span className="text-accent">AED 50</span> Off
            <br />
            Premium Inspection
          </h2>
          <p className="mt-1.5 text-sm text-text-secondary">
            Claim your discount and reserve it for 48 hours.
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-accent">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Offer reserved for 48 hours
          </div>
          <div className="mt-2 flex items-start justify-center gap-3">
            <TimeBox value={time.hours} label="Hours" />
            <span className="pt-1.5 text-2xl font-black text-text-muted">:</span>
            <TimeBox value={time.minutes} label="Minutes" />
            <span className="pt-1.5 text-2xl font-black text-text-muted">:</span>
            <TimeBox value={time.seconds} label="Seconds" />
          </div>

          <button
            type="button"
            onClick={handleClaim}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-button bg-accent px-6 py-3.5 text-base font-bold text-background transition-colors hover:bg-accent-hover"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Claim Discount on WhatsApp
          </button>
          <p className="mt-2 text-center text-[11px] text-text-muted">
            Opens WhatsApp with your claim message.
          </p>

          <div className="mt-4 flex items-start gap-1.5 border-t border-border pt-3 text-[11px] leading-snug text-text-muted">
            <BadgeCheck className="mt-px h-3.5 w-3.5 flex-shrink-0 text-success" aria-hidden="true" />
            <span>
              Valid for Premium Inspection only. Discount must be used within 48 hours of claiming.
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
