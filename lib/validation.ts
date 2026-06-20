import { BookingFormData, BookingFormErrors, Emirate, ParkingType, PackageId } from '@/types/booking'
import { isSlotTime } from '@/lib/packages'

/** Today in Asia/Dubai (the slot model's timezone) as yyyy-mm-dd — correct
 *  regardless of the visitor's device timezone. This is the SINGLE source of
 *  truth for "today": ScheduleSlot imports it so the form's lower-bound check
 *  and the date the UI pre-selects can never disagree (users east of UTC+4 were
 *  previously rejected for same-day bookings because the device-local date had
 *  already rolled over). UAE has no DST. */
export function dubaiTodayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date())
}

/** Add n days to a yyyy-mm-dd string without timezone drift. Used to derive the
 *  far-future booking cap (mirrors ScheduleSlot's MAX_DAYS). */
function addDaysISO(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Furthest bookable date ahead of today — mirrors ScheduleSlot's MAX_DAYS so
 *  the server rejects exactly what the UI's date input caps. */
const MAX_BOOKING_DAYS = 60

/** Valid emirate values — kept in sync with the Emirate union in types/booking. */
const EMIRATES: readonly Emirate[] = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
  'Al Ain',
]

/** Valid parking-type values — kept in sync with the ParkingType union. */
const PARKING_TYPES: readonly ParkingType[] = ['showroom', 'outdoor', 'home']

/** Valid package ids — kept in sync with the PackageId union. */
const PACKAGE_IDS: readonly PackageId[] = ['standard', 'comprehensive', 'premium']

/**
 * Max lengths for free-text customer fields. The DB columns are unbounded
 * `text`, so without these a crafted POST could store arbitrarily large values.
 * Generous enough for any legitimate input; the UI never approaches them.
 */
const MAX_LEN = {
  customerName: 120,
  address: 500,
  additionalNotes: 2000,
  carMake: 80,
  carModel: 80,
} as const

/**
 * Accepts UAE-style phone numbers, tolerating spaces, dashes and a +971 / 0
 * prefix: e.g. "+971 50 123 4567", "0501234567", "50 123 4567".
 */
function isValidUaePhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '')
  const local = digits.replace(/^971/, '').replace(/^0/, '')
  // UAE local numbers are 8–9 digits (mobiles are 9, starting 5).
  return /^\d{8,9}$/.test(local)
}

export function validateForm(form: BookingFormData): BookingFormErrors {
  const errors: BookingFormErrors = {}

  if (!form.customerName.trim()) {
    errors.customerName = 'Full name is required'
  } else if (form.customerName.trim().length < 2) {
    errors.customerName = 'Please enter your full name'
  } else if (form.customerName.trim().length > MAX_LEN.customerName) {
    errors.customerName = 'Name is too long'
  }

  if (!form.customerPhone.trim()) {
    errors.customerPhone = 'Phone number is required'
  } else if (!isValidUaePhone(form.customerPhone)) {
    errors.customerPhone = 'Please enter a valid UAE number (e.g. 050 123 4567)'
  }

  if (form.customerEmail && form.customerEmail.trim()) {
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(form.customerEmail.trim())) {
      errors.customerEmail = 'Please enter a valid email address'
    }
  }

  // Emirate / parking / package: presence AND enum membership. Presence-only let
  // a crafted POST (e.g. emirate: "Mars") through to the DB/RPC, where it surfaced
  // as a confusing 500; reject it here as a 422 field error instead.
  if (!form.emirate) {
    errors.emirate = 'Please select an emirate'
  } else if (!EMIRATES.includes(form.emirate as Emirate)) {
    errors.emirate = 'Please select a valid emirate'
  }

  if (!form.address.trim()) {
    errors.address = 'Please enter or search for a location'
  } else if (form.address.trim().length > MAX_LEN.address) {
    errors.address = 'Address is too long'
  }

  if (!form.parkingType) {
    errors.parkingType = 'Please select a parking type'
  } else if (!PARKING_TYPES.includes(form.parkingType as ParkingType)) {
    errors.parkingType = 'Please select a valid parking type'
  }

  if (!form.carMake) {
    errors.carMake = 'Please select the car brand'
  } else if (form.carMake.trim().length > MAX_LEN.carMake) {
    errors.carMake = 'Car brand is too long'
  }

  if (!form.carModel.trim()) {
    errors.carModel = 'Please enter the car model'
  } else if (form.carModel.trim().length > MAX_LEN.carModel) {
    errors.carModel = 'Car model is too long'
  }

  // Car year: must be a 4-digit string within a plausible range (the UI offers a
  // dropdown, but a raw POST could send anything).
  if (!form.carYear) {
    errors.carYear = 'Please select the year'
  } else if (!/^[0-9]{4}$/.test(form.carYear)) {
    errors.carYear = 'Please enter a valid year'
  } else {
    const year = Number(form.carYear)
    const maxYear = new Date().getFullYear() + 1
    if (year < 1980 || year > maxYear) errors.carYear = 'Please enter a valid year'
  }

  // Package id is sent by the client and used to derive the (authoritative) price,
  // so an unknown id must fail validation rather than reach the catalogue lookup.
  if (!PACKAGE_IDS.includes(form.packageId)) {
    errors.packageId = 'Please choose a valid package'
  }

  if (!form.inspectionDate) {
    errors.inspectionDate = 'Please choose a date'
  } else if (form.inspectionDate < dubaiTodayISO()) {
    // Compare against DUBAI today (not device-local) so visitors east of UTC+4
    // aren't wrongly rejected for the same-day slot the UI pre-selected.
    errors.inspectionDate = 'Please choose today or a future date'
  } else if (form.inspectionDate > addDaysISO(dubaiTodayISO(), MAX_BOOKING_DAYS)) {
    // Upper bound mirrors the UI's date-input cap (ScheduleSlot MAX_DAYS).
    errors.inspectionDate = 'Please choose a date within the next two months'
  }

  if (!form.slotTime) {
    errors.slotTime = 'Please choose a time slot'
  } else if (!isSlotTime(form.slotTime)) {
    errors.slotTime = 'Please choose a valid time slot'
  }

  // Optional free-text fields: only length-capped (content is unvalidated by design).
  if (form.additionalNotes.trim().length > MAX_LEN.additionalNotes) {
    errors.additionalNotes = 'Please shorten your note'
  }

  return errors
}

export function scrollToFirstError(errors: BookingFormErrors): void {
  const firstKey = Object.keys(errors)[0]
  if (!firstKey) return
  const el = document.getElementById(`field-${firstKey}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const input = el.querySelector('input, select, textarea') as HTMLElement | null
    input?.focus()
  }
}
