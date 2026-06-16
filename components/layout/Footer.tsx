import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'
import { Logo } from './Logo'
import {
  InstagramGlyph,
  TikTokGlyph,
  WhatsAppGlyph,
  INSTAGRAM_URL,
  TIKTOK_URL,
  WHATSAPP_NUMBER,
} from './SocialIcons'

const PHONE = process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+971 502526314'
const EMAIL = process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'crescentcarcheck@gmail.com'
// Instagram + TikTok are only rendered once the client provides a real handle,
// so we never ship a dead href="#" link that just jumps to the top of the page.

const SERVICES = [
  { href: '/packages', label: 'Pre-Purchase Inspection' },
  { href: '/packages', label: 'Comprehensive Check' },
  { href: '/packages', label: 'Premium Inspection' },
]

const COMPANY = [
  { href: '/about', label: 'About Us' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/contact', label: 'Contact' },
]

const linkClass =
  'text-text-secondary text-sm hover:text-text-primary transition-colors duration-200'
const headingClass =
  'text-xs font-semibold tracking-widest text-text-muted mb-4'

export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="container-wide py-14 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo />
            <p className="text-text-secondary text-sm mt-4 max-w-xs">
              Independent pre-purchase car inspections, on-site across the UAE.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {INSTAGRAM_URL && (
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-text-primary hover:bg-accent hover:text-background hover:border-accent transition-colors duration-200"
                >
                  <InstagramGlyph className="w-4 h-4" />
                </a>
              )}
              {TIKTOK_URL && (
                <a
                  href={TIKTOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-text-primary hover:bg-accent hover:text-background hover:border-accent transition-colors duration-200"
                >
                  <TikTokGlyph className="w-4 h-4" />
                </a>
              )}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-text-primary hover:bg-accent hover:text-background hover:border-accent transition-colors duration-200"
              >
                <WhatsAppGlyph className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className={headingClass}>SERVICES</h3>
            <ul className="space-y-3">
              {SERVICES.map((item, i) => (
                <li key={i}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={headingClass}>COMPANY</h3>
            <ul className="space-y-3">
              {COMPANY.map((item, i) => (
                <li key={i}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={headingClass}>CONTACT</h3>
            <ul className="space-y-3">
              <li>
                <a href={`tel:${PHONE}`} className={`${linkClass} flex items-center gap-2`}>
                  <Phone className="w-4 h-4 text-accent flex-shrink-0" aria-hidden="true" />
                  {PHONE}
                </a>
              </li>
              <li>
                <a href={`mailto:${EMAIL}`} className={`${linkClass} flex items-center gap-2`}>
                  <Mail className="w-4 h-4 text-accent flex-shrink-0" aria-hidden="true" />
                  {EMAIL}
                </a>
              </li>
              <li className="text-text-secondary text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0" aria-hidden="true" />
                Sharjah, UAE
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-wide py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-text-muted text-sm">
            © 2026 Crescent Car Check. All rights reserved.
          </p>
          <p className="text-text-muted text-sm">
            <Link href="/privacy" className="hover:text-text-secondary transition-colors">
              Privacy
            </Link>
            <span className="mx-2">·</span>
            <Link href="/terms" className="hover:text-text-secondary transition-colors">
              Terms
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
