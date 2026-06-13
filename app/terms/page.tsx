import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms that govern your use of Crescent Car Check and the pre-purchase vehicle inspections we provide across the UAE.',
}

const LAST_UPDATED = '1 June 2026'

// Match the env-driven address used in the Footer, Contact and Confirmation
// pages so every contact surface resolves to one email once env is set.
const BUSINESS_EMAIL = process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'crescentcarcheck@gmail.com'

const SECTIONS = [
  {
    heading: 'Acceptance of Terms',
    body: [
      'By booking an inspection or using the Crescent Car Check website, you agree to these terms of service. If you do not agree with them, please do not use our service.',
    ],
  },
  {
    heading: 'Our Service',
    body: [
      'Crescent Car Check provides independent, visual pre-purchase inspections of used vehicles at the location you specify within the UAE. Our report reflects the condition of the vehicle as observed at the time of inspection and is intended to help you make an informed buying decision.',
    ],
  },
  {
    heading: 'Bookings and Payment',
    body: [
      'When you book, you agree to provide accurate details about the vehicle and its location. Prices are shown at the time of booking. Payment is due as set out during checkout, and your inspection is confirmed once payment and scheduling are complete.',
    ],
  },
  {
    heading: 'Scope and Limitations',
    body: [
      'Our inspection is non-invasive and does not include dismantling the vehicle, road-testing beyond what is reasonable, or guaranteeing future reliability. We report on faults that are reasonably observable during a standard inspection. We cannot detect hidden defects that are not apparent at the time of inspection.',
    ],
  },
  {
    heading: 'No Guarantee of Purchase Outcome',
    body: [
      'Our report is advisory. The decision to buy a vehicle, and any negotiation with the seller, remains entirely yours. We are not a party to any sale and accept no responsibility for the conduct of buyers or sellers.',
    ],
  },
  {
    heading: 'Liability',
    body: [
      'To the fullest extent permitted by law, our liability in connection with an inspection is limited to the amount you paid for that inspection. We are not liable for indirect or consequential losses arising from your reliance on our report.',
    ],
  },
  {
    heading: 'Cancellations and Rescheduling',
    body: [
      'If you need to cancel or reschedule, please contact us as early as possible. We will do our best to accommodate changes, subject to inspector availability and any applicable cancellation terms communicated at the time of booking.',
    ],
  },
  {
    heading: 'Contact Us',
    body: [
      `For any questions about these terms, please contact us at ${BUSINESS_EMAIL}.`,
    ],
  },
]

export default function TermsPage() {
  return (
    <section className="bg-background page-header">
      <div className="container-wide">
        <div className="max-w-3xl">
          <h1 className="text-display-md sm:text-display-lg font-black text-text-primary leading-[1.05]">
            Terms of <span className="text-accent">Service</span>
          </h1>
          <p className="text-text-muted text-sm mt-4">Last updated {LAST_UPDATED}</p>

          <div className="mt-10 space-y-10">
            {SECTIONS.map(({ heading, body }) => (
              <div key={heading}>
                <h2 className="text-text-primary font-bold text-xl md:text-2xl">{heading}</h2>
                {body.map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-text-secondary text-base mt-3 leading-relaxed"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
