import { Suspense } from 'react'
import type { Metadata } from 'next'
import { CheckCircle2, MessageCircle, Phone, Mail, ArrowRight } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { ConfirmationDetails } from '@/components/checkout/ConfirmationDetails'
import { telHref } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Booking Received',
  description: 'Your Crescent Car Check inspection request has been received. We will be in touch shortly.',
  robots: { index: false, follow: false },
}

const BUSINESS_PHONE = process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+971 502526314'
const BUSINESS_EMAIL = process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'crescentcarcheck@gmail.com'
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '971502526314'

const NEXT_STEPS = [
  {
    n: '1',
    title: 'We confirm your slot',
    body: "Your booking is confirmed for your selected slot. Our team will contact you on WhatsApp to confirm the exact arrival timing.",
  },
  {
    n: '2',
    title: 'We meet the car at your location',
    body: 'The inspector travels to the address you shared, runs the inspection on-site, and documents every finding with photos.',
  },
  {
    n: '3',
    title: 'You get your digital report',
    body: "The full report lands in your inbox the moment the inspection ends — use it to negotiate or walk away with confidence.",
  },
] as const

export default function ConfirmationPage() {
  return (
    <>
      <section className="bg-background page-header">
        <div className="container-wide">
          <div className="max-w-3xl">
            <div
              className="w-16 h-16 rounded-full bg-success-muted border border-success/30 flex items-center justify-center mb-6"
              aria-hidden="true"
            >
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <p className="text-success font-semibold text-sm uppercase tracking-wider mb-3">
              Payment received
            </p>
            <h1 className="text-display-md sm:text-display-lg md:text-display-xl font-black text-text-primary leading-[1.05] md:leading-[1.02] break-words">
              Your <span className="text-accent">inspection request</span> is in.
            </h1>
            <p className="text-text-secondary text-base md:text-lg mt-5 max-w-2xl leading-relaxed">
              Thanks! We&apos;ve received your payment and your inspection request. We&apos;ll
              review the car&apos;s location and our inspector&apos;s availability, then confirm
              the exact arrival time by WhatsApp.
            </p>

            <Suspense fallback={null}>
              <ConfirmationDetails />
            </Suspense>
          </div>
        </div>
      </section>

      {/* What happens next */}
      <section className="bg-light-bg section-padding">
        <div className="container-wide">
          <div className="max-w-3xl">
            <h2 className="text-display-sm md:text-display-md font-bold text-light-text leading-tight">
              Three Steps Between You and a Clear Verdict
            </h2>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
            {NEXT_STEPS.map((step) => (
              <li
                key={step.n}
                className="
                  bg-light-card rounded-card border border-light-border p-6
                  hover:border-accent transition-colors duration-200
                "
              >
                <span
                  aria-hidden="true"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/15 border border-accent/30 text-accent font-black"
                >
                  {step.n}
                </span>
                <h3 className="text-light-text font-bold text-lg mt-4">{step.title}</h3>
                <p className="text-light-text-secondary text-sm mt-2 leading-relaxed">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <ButtonLink
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                'Hi Crescent Car Check, I just booked an inspection and wanted to share more details.',
              )}`}
              size="lg"
              arrow
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Message us on WhatsApp
            </ButtonLink>
            <p className="text-light-text-muted text-sm">
              Have more context to share about the car? Send it via WhatsApp and we&apos;ll
              brief the inspector.
            </p>
          </div>
        </div>
      </section>

      {/* Contact card */}
      <section className="bg-background section-padding">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
            <div>
              <h2 className="text-display-sm md:text-display-md font-bold text-text-primary leading-tight">
                Need to reach us before then?
              </h2>
              <p className="text-text-secondary mt-3 leading-relaxed">
                We&apos;re the fastest on WhatsApp, but you can reach us any way you like.
              </p>
            </div>

            <ul className="space-y-3">
              <ContactRow
                href={telHref(BUSINESS_PHONE)}
                Icon={Phone}
                label="Call us"
                value={BUSINESS_PHONE}
              />
              <ContactRow
                href={`https://wa.me/${WHATSAPP}`}
                Icon={MessageCircle}
                label="WhatsApp"
                value="Tap to message"
              />
              <ContactRow
                href={`mailto:${BUSINESS_EMAIL}`}
                Icon={Mail}
                label="Email"
                value={BUSINESS_EMAIL}
              />
            </ul>
          </div>

          <div className="mt-12 text-center">
            <ButtonLink href="/" variant="ghost" size="md">
              Back to home
              <ArrowRight className="w-4 h-4 ml-1" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}

function ContactRow({
  href,
  Icon,
  label,
  value,
}: {
  href: string
  Icon: typeof Phone
  label: string
  value: string
}) {
  return (
    <li>
      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="
          flex items-center gap-4 px-4 py-3
          bg-card rounded-card border border-border
          hover:border-accent transition-colors duration-200
        "
      >
        <span
          aria-hidden="true"
          className="w-10 h-10 rounded-full bg-accent/15 border border-accent/30 grid place-items-center"
        >
          <Icon className="w-4 h-4 text-accent" />
        </span>
        <div className="min-w-0">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">
            {label}
          </p>
          <p className="text-text-primary font-medium truncate">{value}</p>
        </div>
      </a>
    </li>
  )
}
