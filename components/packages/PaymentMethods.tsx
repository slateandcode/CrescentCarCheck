'use client'

import { useState } from 'react'

type Method = {
  name: string
  imageSrc: string
  height: string
  wordmark?: string
}

const CARD_METHODS: Method[] = [
  { name: 'Mastercard', imageSrc: '/payments/Mastercard.svg', height: 'h-6 sm:h-7', wordmark: 'MC' },
  { name: 'Visa', imageSrc: '/payments/Visa.svg', height: 'h-4 sm:h-5', wordmark: 'VISA' },
  // Apple Pay is offered automatically by Stripe Checkout on eligible Safari/iOS
  // devices when card payments are enabled — no extra integration needed — so the
  // mark is accurate to display alongside the cards (brief item 3, payment row).
  { name: 'Apple Pay', imageSrc: '/payments/ApplePay.svg', height: 'h-6 sm:h-7', wordmark: 'Apple Pay' },
]

const TABBY: Method = {
  name: 'Tabby',
  imageSrc: '/payments/Tabby.webp',
  height: 'h-6 sm:h-7',
  wordmark: 'tabby',
}

function Mark({ method }: { method: Method }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span className="font-bold tracking-tight text-light-text text-xs sm:text-sm">
        {method.wordmark ?? method.name}
      </span>
    )
  }

  return (
    // Plain <img>: small payment marks (SVG/webp) with an onError → wordmark
    // fallback that next/image can't express; not an LCP element.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={method.imageSrc}
      alt={`${method.name} accepted`}
      onError={() => setFailed(true)}
      className={`${method.height} w-auto object-contain`}
    />
  )
}

export function PaymentMethods() {
  return (
    <div className="mt-8 flex justify-center">
      <div
        className="
          inline-flex max-w-full flex-wrap items-center justify-center
          gap-x-4 sm:gap-x-5 gap-y-2
          rounded-card border border-light-border bg-light-card
          px-5 sm:px-8 py-3.5 sm:py-4
        "
        aria-label="Accepted payment methods"
      >
        <span className="text-light-text font-medium text-sm sm:text-base">
          Pay with card
        </span>
        <span className="flex items-center gap-2 sm:gap-3">
          {CARD_METHODS.map((m) => (
            <Mark key={m.name} method={m} />
          ))}
        </span>
        <span className="text-light-text-muted text-sm sm:text-base">or</span>
        <Mark method={TABBY} />
      </div>
    </div>
  )
}
