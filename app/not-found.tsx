import type { Metadata } from 'next'
import { ButtonLink } from '@/components/ui/ButtonLink'

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <section className="bg-background page-header min-h-[70svh] flex items-center">
      <div className="container-wide">
        <div className="max-w-2xl">
          <p className="text-accent font-bold tracking-[0.2em] uppercase text-sm">
            404
          </p>
          <h1 className="text-display-md sm:text-display-lg md:text-display-xl font-black text-text-primary leading-[1.05] mt-3">
            This page took a <span className="text-accent">wrong turn</span>.
          </h1>
          <p className="text-text-secondary text-base md:text-lg mt-5 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s
            get you back on the road.
          </p>

          <div className="mt-8 flex flex-col xs:flex-row items-stretch xs:items-center gap-3">
            <ButtonLink href="/" size="lg" arrow fullWidth className="xs:w-auto">
              Back to home
            </ButtonLink>
            <ButtonLink href="/pricing" variant="ghost" size="lg" fullWidth className="xs:w-auto">
              See inspection packages
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  )
}
