import { Metadata } from 'next'
import { getLocalBusinessSchema } from '@/lib/structured-data'
import { HeroSection } from '@/components/home/HeroSection'
import { TrustBar } from '@/components/home/TrustBar'
import { WhyInspectionMatters } from '@/components/home/WhyInspectionMatters'
import { PackagesSection } from '@/components/home/PackagesSection'
import { HowItWorks } from '@/components/home/HowItWorks'
import { WhyChooseUs } from '@/components/home/WhyChooseUs'
import { InspectionHighlights } from '@/components/home/InspectionHighlights'
import { SampleReport } from '@/components/home/SampleReport'
import { RecentlyInspected } from '@/components/home/RecentlyInspected'
import { Testimonials } from '@/components/home/Testimonials'
import { FAQ } from '@/components/home/FAQ'
import { CTABanner } from '@/components/home/CTABanner'
import { DiscountPopup } from '@/components/home/DiscountPopup'

export const metadata: Metadata = {
  title: 'Professional Car Inspections in UAE',
}

export default function HomePage() {
  return (
    <>
      {/* Native <script> for inert structured data (the Next-recommended way) with
          `<` escaped so a stray '<' in any field can't break out of the tag. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getLocalBusinessSchema()).replace(/</g, '\\u003c'),
        }}
      />
      <HeroSection />
      <TrustBar />
      <InspectionHighlights />
      <PackagesSection />
      <RecentlyInspected />
      <HowItWorks />
      <WhyInspectionMatters />
      <SampleReport />
      <WhyChooseUs />
      <Testimonials />
      <FAQ />
      <CTABanner />
      <DiscountPopup />
    </>
  )
}
