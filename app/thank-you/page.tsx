import type { Metadata } from 'next'
import { CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { ButtonLink } from '@/components/ui/ButtonLink'

// Google Ads conversion destination: the contact form redirects here on a
// successful submit, and the ads agency counts page views of /thank-you as
// form-lead conversions. Keep the URL stable.
export const metadata: Metadata = {
  title: 'Thank You',
  description: 'Your message has been received. We will reach back to you shortly.',
  robots: { index: false, follow: false },
}

export default function ThankYouPage() {
  return (
    <section className="bg-background page-header">
      <div className="container-wide">
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center py-10 md:py-20">
          <Logo className="h-12 w-[173px] md:h-14 md:w-[202px]" />

          <div
            className="w-16 h-16 rounded-full bg-success-muted border border-success/30 flex items-center justify-center mt-10"
            aria-hidden="true"
          >
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>

          <p className="text-success font-semibold text-sm uppercase tracking-wider mt-6">
            Message received
          </p>
          <h1 className="text-display-md sm:text-display-lg md:text-display-xl font-black text-text-primary leading-[1.05] md:leading-[1.02] mt-3">
            Thank <span className="text-accent">You</span>
          </h1>
          <p className="text-text-secondary text-base md:text-lg mt-5 max-w-lg leading-relaxed">
            We will reach back to you shortly, usually within a few hours on
            weekdays. Check your inbox (and spam folder, just in case).
          </p>

          <div className="mt-10">
            <ButtonLink href="/" size="lg" arrow>
              Visit our website
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  )
}
