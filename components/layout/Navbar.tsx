'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import { InstagramGlyph, TikTokGlyph, INSTAGRAM_URL, TIKTOK_URL } from './SocialIcons'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/packages', label: 'Packages' },
  { href: '/#recently-inspected', label: 'Recently Inspected Cars' },
  { href: '/#faqs', label: 'FAQs' },
  { href: '/about', label: 'About Us' },
] as const

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => document.body.classList.remove('overflow-hidden')
  }, [mobileOpen])

  // Close menu on Escape + trap focus within the open menu
  useEffect(() => {
    if (!mobileOpen) return

    const menu = menuRef.current
    const focusable = menu?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    )
    focusable?.[0]?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false)
        return
      }
      if (e.key !== 'Tab' || !focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:bg-accent focus:text-background focus:px-4 focus:py-2 focus:rounded-button focus:font-semibold"
      >
        Skip to content
      </a>

      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-shadow duration-300',
          'bg-background/95 backdrop-blur-md border-b border-border',
          scrolled && 'shadow-[0_8px_24px_rgba(0,0,0,0.4)]'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 md:h-24 gap-3">
            <Link
              href="/"
              aria-label="Crescent Car Check home"
              className="flex items-center -ml-1 flex-shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Logo />
            </Link>

            <nav className="hidden lg:flex items-center gap-7 xl:gap-8" aria-label="Primary">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={cn(
                    'text-sm font-medium whitespace-nowrap transition-colors duration-200',
                    isActive(link.href)
                      ? 'text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/packages"
              className="hidden lg:inline-flex bg-accent text-background font-semibold text-sm px-5 py-2.5 rounded-button hover:bg-accent-hover transition-colors duration-200"
            >
              Book Inspection
            </Link>

            {/* Mobile / tablet: compact BOOK pill + hamburger */}
            <div className="flex items-center gap-2 lg:hidden">
              <Link
                href="/packages"
                className="inline-flex items-center bg-accent text-background font-semibold text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-button hover:bg-accent-hover transition-colors duration-200 whitespace-nowrap"
              >
                <span className="sm:hidden">Book</span>
                <span className="hidden sm:inline">Book Inspection</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                className="inline-flex items-center justify-center w-11 h-11 -mr-2 rounded-md text-text-primary hover:bg-card transition-colors"
              >
                <Menu className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-50 bg-background flex flex-col animate-slide-in-right lg:hidden"
        >
          <div className="flex items-center justify-between h-20 px-4 border-b border-border">
            <Link href="/" onClick={() => setMobileOpen(false)} aria-label="Crescent Car Check home">
              <Logo />
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="p-2 -mr-2 text-text-primary"
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>

          <nav
            className="flex-1 flex flex-col items-center justify-center gap-8"
            aria-label="Mobile"
          >
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={cn(
                  'text-2xl font-semibold opacity-0 animate-fade-in-up',
                  `reveal-delay-${i + 1}`,
                  isActive(link.href) ? 'text-accent' : 'text-text-primary'
                )}
                style={{ animationDelay: `${0.1 * (i + 1)}s` }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="p-6 border-t border-border">
            {(INSTAGRAM_URL || TIKTOK_URL) && (
              <div className="flex items-center justify-center gap-3 mb-5">
                {INSTAGRAM_URL && (
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center text-text-primary hover:bg-accent hover:text-background hover:border-accent transition-colors duration-200"
                  >
                    <InstagramGlyph className="w-5 h-5" />
                  </a>
                )}
                {TIKTOK_URL && (
                  <a
                    href={TIKTOK_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="TikTok"
                    className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center text-text-primary hover:bg-accent hover:text-background hover:border-accent transition-colors duration-200"
                  >
                    <TikTokGlyph className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
            <Link
              href="/packages"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center w-full bg-accent text-background font-semibold py-4 rounded-button hover:bg-accent-hover transition-colors duration-200"
            >
              Book Inspection →
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
