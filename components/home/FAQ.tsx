'use client'

import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'
import { trackEvent, GA_EVENTS } from '@/lib/analytics'

export interface FAQItem {
  question: string
  answer: string
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    question: 'How long does a car inspection take?',
    answer:
      'An inspection takes between 60 and 90 minutes depending on the package you choose. The Premium inspection, being the most detailed, may take up to two hours. Our inspector will keep you informed throughout.',
  },
  {
    question: 'Where do you carry out the inspection?',
    answer:
      "We come to wherever the car is: the seller's home, a showroom, or an outdoor parking area, anywhere across the UAE. You simply share the location when booking and our inspector travels to the vehicle.",
  },
  {
    question: 'What does the inspection report include?',
    answer:
      'Your digital report covers every system we check, including engine, transmission, electricals, suspension, brakes, body and interior, along with photos of any faults found, an accident-history summary, and our honest overall assessment of the vehicle.',
  },
  {
    question: 'Can I attend the inspection in person?',
    answer:
      'Absolutely. You are welcome to be present and ask the inspector questions directly. Many customers find it valuable, though it is not required, and your full report is delivered digitally either way.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'All bookings are paid securely online via Stripe, which accepts Visa, Mastercard, and most major debit and credit cards. Your payment details are never stored on our servers.',
  },
  {
    question: 'How quickly will I receive my report?',
    answer:
      'Your complete digital report is sent to you the moment the inspection finishes, typically within minutes. There is no waiting around for results.',
  },
  {
    question: 'Do you inspect all car brands and models?',
    answer:
      'Yes. Our inspectors are experienced across all makes and models, from everyday Japanese and Korean cars to German and British luxury vehicles, SUVs, and 4x4s.',
  },
]

interface FAQProps {
  title?: string
  label?: string
  questions?: FAQItem[]
}

export function FAQ({
  title = 'Frequently Asked Questions',
  label = 'FAQ',
  questions = DEFAULT_FAQS,
}: FAQProps = {}) {
  const ref = useReveal<HTMLDivElement>()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const baseId = useId()

  const toggle = (index: number) => {
    setOpenIndex((prev) => {
      const next = prev === index ? null : index
      if (next === index) trackEvent(GA_EVENTS.FAQ_OPENED, { question_index: index })
      return next
    })
  }

  return (
    <section id="faqs" className="bg-light-bg section-padding scroll-mt-20">
      <div ref={ref} className="reveal container-wide">
        <div className="text-center">
          {label && (
            <p className="text-accent text-xs font-bold uppercase tracking-widest mb-3">
              {label}
            </p>
          )}
          <h2 className="text-display-sm md:text-display-md font-bold text-light-text">
            {title}
          </h2>
        </div>

        <div className="max-w-3xl mx-auto mt-12">
          {questions.map((faq, index) => {
            const open = openIndex === index
            const buttonId = `${baseId}-q-${index}`
            const panelId = `${baseId}-a-${index}`
            return (
              <div
                key={index}
                className={cn(
                  'border-b border-light-border',
                  open && 'border-l-2 border-l-accent pl-4'
                )}
              >
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => toggle(index)}
                    className="flex items-center justify-between w-full py-5 text-left cursor-pointer"
                  >
                    <span className="font-semibold text-light-text text-base pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-5 h-5 text-light-text-secondary flex-shrink-0 transition-transform duration-300',
                        open && 'rotate-180'
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={cn(
                    'grid transition-all duration-300 ease-smooth',
                    open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="text-light-text-secondary text-sm leading-relaxed pb-5">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
