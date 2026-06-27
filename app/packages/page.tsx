import type { Metadata } from 'next'
import { PackageCard } from '@/components/ui/PackageCard'
import { CTABanner } from '@/components/home/CTABanner'
import { FAQ, type FAQItem } from '@/components/home/FAQ'
import { PackageHelpForm } from '@/components/packages/PackageHelpForm'
import { PaymentMethods } from '@/components/packages/PaymentMethods'
import { PACKAGES } from '@/lib/packages'

export const metadata: Metadata = {
  title: 'Inspection Packages & Pricing',
  description:
    'Compare Crescent Car Check inspection packages: Standard and Premium. On-site inspection anywhere in the UAE with an instant digital report.',
}

const PACKAGE_FAQS: FAQItem[] = [
  {
    question: 'Which package should I choose?',
    answer:
      'Standard covers the full pre-purchase inspection most buyers need — accident history, bodywork and paint meter, chassis, interior and AC, engine bay and fluid leaks, computer diagnostics, battery, electrics, tyres, suspension, transmission and a basic test drive, ending with a buy / negotiate / avoid recommendation. Premium adds the deeper checks for a high-value purchase: a full underbody inspection, an advanced camera check for hidden leaks, brake disc wear, an odometer-tampering assessment, a 10-minute continuous test drive, a 20-minute inspector summary call and price negotiation notes.',
  },
  {
    question: "Do you inspect at the seller's location?",
    answer:
      "Yes. Every Crescent inspection is carried out on-site, wherever the car is: the seller's home, a showroom, or an outdoor parking area. You share the location when booking and our inspector travels to the vehicle.",
  },
  {
    question: 'How quickly do I get the report?',
    answer:
      'Your full digital report is sent to you the moment the inspection finishes, usually within minutes. You can read it on the spot, before the conversation with the seller is over.',
  },
  {
    question: 'Can I use the report to negotiate?',
    answer:
      'That is exactly what most buyers do. The report lists every finding with photos, so you have clear, evidence-backed leverage. The Premium package also includes price negotiation notes and a 20-minute inspector summary call to translate findings into a fair-value adjustment.',
  },
  {
    question: 'What if the car has serious issues?',
    answer:
      'You walk away with a clear, honest assessment. If we find serious defects, our inspector flags them plainly so you can renegotiate or step back from the deal. Either way, you have spent a fraction of the cost of a bad purchase to find out.',
  },
]

export default function PackagesPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-background pt-24 sm:pt-28 md:pt-32 pb-6 sm:pb-8 md:pb-10">
        <div className="container-wide">
          <div className="max-w-3xl">
            <h1 className="text-display-md sm:text-display-lg md:text-display-xl font-black text-text-primary leading-[1.05] md:leading-[1.02] break-words">
              An Inspection Package for Every Kind of Car
            </h1>
            <p className="text-text-secondary text-base md:text-lg mt-5 max-w-2xl leading-relaxed">
              Every Crescent inspection is carried out on-site at the seller&apos;s
              location, anywhere in the UAE, and ends with a detailed digital report.
              Choose the depth of inspection that matches the car you&apos;re buying.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing cards + comparison */}
      <section className="bg-light-bg pt-8 pb-16 sm:pt-10 sm:pb-20 md:pt-12 md:pb-24 lg:pb-28">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
            {PACKAGES.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                linkHref={`/checkout?package=${pkg.id}`}
              />
            ))}
          </div>

          <p className="text-center text-light-text-muted text-sm mt-8">
            All prices inclusive of VAT. Payment secured by Stripe. No hidden fees.
          </p>

          <PaymentMethods />
        </div>
      </section>

      {/* Personal guidance form for undecided buyers */}
      <PackageHelpForm />

      {/* Packages FAQ */}
      <FAQ
        label="Common Questions"
        title="Questions Buyers Often Ask"
        questions={PACKAGE_FAQS}
      />

      {/* Final CTA */}
      <CTABanner />
    </>
  )
}
