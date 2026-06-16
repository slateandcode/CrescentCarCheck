'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { InspectedCar } from '@/lib/inspected-cars'

interface InspectionVideoModalProps {
  car: InspectedCar | null
  onClose: () => void
}

/**
 * Centered lightbox that plays a car's inspection video (portrait 9:16 reel).
 * Rendered through a portal to document.body so the fixed overlay escapes the
 * carousel's overflow-x-auto clipping and layers above the fixed header.
 * Closes on Escape / backdrop / ✕, locks body scroll, and traps focus —
 * modeled on the Navbar dialog pattern.
 */
export function InspectionVideoModal({ car, onClose }: InspectionVideoModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!car?.video) return

    document.body.classList.add('overflow-hidden')

    const dialog = dialogRef.current
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), video'
    )
    focusable?.[0]?.focus()

    // Kick off playback explicitly from the click that opened the modal.
    // Browsers (notably Safari/iOS, and Chrome without prior interaction) block
    // autoplay of video WITH SOUND, which would otherwise leave the clip frozen
    // on its poster. If the sound attempt is rejected, retry muted — muted
    // autoplay is always allowed — so the clip always starts; the user can
    // unmute via the controls.
    const video = videoRef.current
    if (video) {
      video.play().catch(() => {
        video.muted = true
        video.play().catch(() => {})
      })
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !focusable || focusable.length === 0) return
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
      document.body.classList.remove('overflow-hidden')
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [car, onClose])

  // `car` is null on the initial SSR + client render, so the portal only ever
  // mounts after a client-side click — document is guaranteed to exist here.
  if (!car?.video || typeof document === 'undefined') return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${car.make} ${car.model} inspection video`}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-card-lg overflow-hidden bg-black shadow-glow animate-scale-in focus:outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="absolute right-3 top-3 z-10 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <video
          key={car.slug}
          ref={videoRef}
          src={car.video}
          poster={car.image}
          controls
          playsInline
          className="w-full h-auto max-h-[85vh] bg-black"
        >
          <p className="p-4 text-white text-sm">
            Your browser can&apos;t play this video.
          </p>
        </video>

        <div className="px-4 py-3 bg-background border-t border-border">
          <p className="text-text-primary font-semibold text-sm">
            {car.make} {car.model}
          </p>
          <p className="text-text-secondary text-xs">
            Crescent Score: <span className="text-accent font-semibold">{car.crescentScore}%</span>
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
