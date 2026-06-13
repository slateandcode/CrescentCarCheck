import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Crescent Car Check collects, uses, and protects your personal information when you book an inspection or contact us.',
}

const LAST_UPDATED = '1 June 2026'

// Match the env-driven address used in the Footer, Contact and Confirmation
// pages so every contact surface resolves to one email once env is set.
const BUSINESS_EMAIL = process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'crescentcarcheck@gmail.com'

const SECTIONS = [
  {
    heading: 'Who We Are',
    body: [
      'Crescent Car Check provides independent pre-purchase car inspection services across the United Arab Emirates. This policy explains how we handle the personal information you share with us when you visit our website, request an inspection, or get in touch.',
    ],
  },
  {
    heading: 'Information We Collect',
    body: [
      'When you book an inspection or contact us, we may collect your name, phone number, email address, and details about the vehicle and its location. If you pay online, payment is processed by our payment provider — we do not store your full card details on our servers.',
    ],
  },
  {
    heading: 'How We Use Your Information',
    body: [
      'We use your information to arrange and carry out inspections, send you your inspection report, respond to enquiries, and keep you updated about your booking. We may also use it to improve our service and, where you have agreed, to send you relevant updates.',
    ],
  },
  {
    heading: 'Sharing Your Information',
    body: [
      'We do not sell your personal information. We share it only with the service providers we rely on to operate — such as our payment, email, and hosting partners — and only to the extent needed to deliver our service or comply with the law.',
    ],
  },
  {
    heading: 'Data Retention',
    body: [
      'We keep your information only for as long as necessary to provide our service, meet our legal and accounting obligations, and resolve any disputes. When it is no longer needed, we securely delete or anonymise it.',
    ],
  },
  {
    heading: 'Your Rights',
    body: [
      'You may ask us to access, correct, or delete the personal information we hold about you, or to stop sending you marketing messages. To make a request, contact us using the details below and we will respond as soon as we reasonably can.',
    ],
  },
  {
    heading: 'Contact Us',
    body: [
      `If you have any questions about this privacy policy or how we handle your information, please reach out to us at ${BUSINESS_EMAIL}.`,
    ],
  },
]

export default function PrivacyPage() {
  return (
    <section className="bg-background page-header">
      <div className="container-wide">
        <div className="max-w-3xl">
          <h1 className="text-display-md sm:text-display-lg font-black text-text-primary leading-[1.05]">
            Privacy <span className="text-accent">Policy</span>
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
