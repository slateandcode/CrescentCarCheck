import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amountAED: number): string {
  return `AED ${amountAED.toLocaleString('en-AE')}`
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'EEEE, d MMMM yyyy')
}

export function formatShortDate(dateStr: string): string {
  return format(new Date(dateStr), 'd MMM yyyy')
}

export function stripCountryCode(phone: string): string {
  return phone.replace(/^\+971/, '').replace(/^0/, '').trim()
}

/**
 * Build a dialable `tel:` href from a (possibly formatted) phone string. RFC 3966
 * doesn't allow raw spaces, and some mobile dialers / in-app webviews truncate or
 * mis-parse at the space — so strip everything except digits and a leading +.
 * Keep the formatted string for DISPLAY; only the href needs normalising.
 */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`
}
