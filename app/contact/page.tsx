import type { Metadata } from 'next'
import { MessageCircle, Phone, Mail, Clock, MapPin, ShieldCheck } from 'lucide-react'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { ContactForm } from '@/components/contact/ContactForm'
import { CTABanner } from '@/components/home/CTABanner'
import { telHref } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with Crescent Car Check. WhatsApp, phone, email, or fill in the form — we reply quickly across the UAE.',
}

const BUSINESS_PHONE = process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+971 502526314'
const BUSINESS_EMAIL = process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'crescentcarcheck@gmail.com'
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '971502526314'

const CONTACT_METHODS = [
  {
    Icon: MessageCircle,
    title: 'WhatsApp',
    value: 'Tap to chat',
    href: `https://wa.me/${WHATSAPP}`,
    cta: 'Open WhatsApp',
    blurb: 'Fastest way to reach us. Send the listing or a few photos and we’ll guide you.',
    external: true,
  },
  {
    Icon: Phone,
    title: 'Phone',
    value: BUSINESS_PHONE,
    href: telHref(BUSINESS_PHONE),
    cta: 'Call now',
    blurb: 'Prefer to talk it through? Calls are answered during working hours.',
    external: false,
  },
  {
    Icon: Mail,
    title: 'Email',
    value: BUSINESS_EMAIL,
    href: `mailto:${BUSINESS_EMAIL}`,
    cta: 'Send an email',
    blurb: 'For longer messages, sharing files, or anything not urgent.',
    external: false,
  },
] as const

const HOURS = [
  { day: 'Monday – Saturday', time: '9:00 AM – 8:00 PM' },
  { day: 'Sunday', time: '10:00 AM – 6:00 PM' },
] as const

export default function ContactPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-background page-header">
        <div className="container-wide">
          <div className="max-w-3xl">
            <h1 className="text-display-md sm:text-display-lg md:text-display-xl font-black text-text-primary leading-[1.05] md:leading-[1.02] break-words">
              Got a Question? <span className="text-accent">Let&apos;s Talk.</span>
            </h1>
            <p className="text-text-secondary text-base md:text-lg mt-5 max-w-2xl leading-relaxed">
              Booking help, package guidance, or a question about an inspection in
              progress — we&apos;re a message away across the UAE.
            </p>
          </div>
        </div>
      </section>

      {/* Contact methods grid */}
      <section className="bg-surface section-padding">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CONTACT_METHODS.map(({ Icon, title, value, href, cta, blurb, external }) => (
              <a
                key={title}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="
                  group relative bg-card rounded-card border border-border p-6
                  hover:border-accent hover:-translate-y-1
                  transition-all duration-300
                "
              >
                <div
                  aria-hidden="true"
                  className="w-12 h-12 rounded-xl bg-accent-muted border border-accent/20 flex items-center justify-center mb-4"
                >
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-text-primary font-bold text-lg">{title}</h2>
                <p className="text-text-primary font-medium text-sm mt-1 break-all">{value}</p>
                <p className="text-text-secondary text-sm mt-3 leading-relaxed">{blurb}</p>
                <span className="inline-flex items-center gap-1 text-accent text-sm font-semibold mt-5 group-hover:gap-2 transition-all duration-200">
                  {cta} <span aria-hidden="true">→</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Form + sidebar */}
      <section className="bg-light-bg section-padding">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-10 lg:gap-16 items-start">
            {/* Form card */}
            <div className="relative order-2 lg:order-1">
              <div
                className="absolute -inset-3 bg-accent/10 rounded-card-lg blur-2xl pointer-events-none"
                aria-hidden="true"
              />
              <div className="relative bg-light-card rounded-card-lg border border-light-border p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
                <h2 className="text-display-sm md:text-display-md font-bold text-light-text leading-tight">
                  Write to us
                </h2>
                <p className="text-light-text-secondary text-sm md:text-base mt-3 leading-relaxed">
                  Drop your details and we&apos;ll reply by email — usually within a few
                  hours on weekdays.
                </p>

                <div className="mt-6">
                  <ContactForm />
                </div>
              </div>
            </div>

            {/* Sidebar: hours + coverage */}
            <aside className="order-1 lg:order-2 lg:sticky lg:top-28 space-y-5">
              <div className="bg-light-card rounded-card border border-light-border p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    aria-hidden="true"
                    className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 grid place-items-center"
                  >
                    <Clock className="w-4 h-4 text-accent" />
                  </span>
                  <h3 className="text-light-text font-bold text-base">Working hours</h3>
                </div>
                <ul className="space-y-1.5">
                  {HOURS.map((h) => (
                    <li
                      key={h.day}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span className="text-light-text-secondary">{h.day}</span>
                      <span className="text-light-text font-medium">{h.time}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-light-text-muted text-xs mt-3 leading-relaxed">
                  Inspection slots run throughout the day. Outside hours, WhatsApp messages
                  are still answered the next morning.
                </p>
              </div>

              <div className="bg-light-card rounded-card border border-light-border p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    aria-hidden="true"
                    className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 grid place-items-center"
                  >
                    <MapPin className="w-4 h-4 text-accent" />
                  </span>
                  <h3 className="text-light-text font-bold text-base">Coverage</h3>
                </div>
                <p className="text-light-text-secondary text-sm leading-relaxed">
                  We come to the vehicle anywhere in the UAE — Dubai, Abu Dhabi, Sharjah,
                  Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain.
                </p>
                <p className="text-light-text-muted text-xs mt-3 leading-relaxed">
                  Outside the main hubs? Add the location at booking and we&apos;ll confirm
                  the soonest slot.
                </p>
              </div>

              <div className="bg-light-card rounded-card border border-light-border p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    aria-hidden="true"
                    className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 grid place-items-center"
                  >
                    <ShieldCheck className="w-4 h-4 text-accent" />
                  </span>
                  <h3 className="text-light-text font-bold text-base">Ready to book?</h3>
                </div>
                <p className="text-light-text-secondary text-sm leading-relaxed">
                  Already know the package you want? Skip the back-and-forth and book
                  directly online.
                </p>
                <div className="mt-4">
                  <ButtonLink href="/packages" size="md" arrow fullWidth>
                    See packages
                  </ButtonLink>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  )
}
