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
