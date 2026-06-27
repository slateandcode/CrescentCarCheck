import { DistanceClass, Emirate, Package, SlotTime } from '@/types/booking'

/**
 * Core checks included in BOTH packages — the ✓✓ rows of the client's package
 * table (brief item 2). Shown with a green tick on every card.
 */
const CORE_FEATURES: string[] = [
  'Accident history check',
  'Flooding & visual rust check',
  'Exterior bodywork check',
  'Bodywork & paint meter check',
  'Chassis condition check',
  'Interior condition check',
  'AC check',
  'Engine bay check',
  'Visible fluid leak check',
  'Computer diagnostic test',
  'Battery health check',
  'Electrical & lights check',
  'Tyres, rims & brakes condition',
  'Suspension check',
  'Transmission check',
  'Basic test drive',
  'Photos of visible faults',
  'Instant digital report',
  'Buy / negotiate / avoid recommendation',
]

/**
 * Extra checks only in Premium (brief item 2/3, the Premium-only rows). Rendered
 * with a green tick on the Premium card and a red cross on the Standard card.
 */
const PREMIUM_FEATURES: string[] = [
  'Full underbody inspection',
  'Advanced camera check for hidden leaks',
  'Brake disc wear check',
  'Odometer tampering assessment',
  '10-minute continuous test drive',
  '20-minute inspector summary call',
  'Price negotiation notes',
]

export const PACKAGES: Package[] = [
  {
    id: 'standard',
    name: 'Standard',
    price: 299,
    tagline: 'Quick confidence before you buy.',
    features: CORE_FEATURES,
    coreFeatures: CORE_FEATURES,
    extraFeatures: PREMIUM_FEATURES.map((label) => ({ label, included: false })),
    ctaLabel: 'Book now',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 399,
    recommended: true,
    tagline: 'Deeper checks. Clearer decision.',
    features: [...CORE_FEATURES, ...PREMIUM_FEATURES],
    coreFeatures: CORE_FEATURES,
    extraFeatures: PREMIUM_FEATURES.map((label) => ({ label, included: true })),
    ctaLabel: 'Book now',
  },
]

export const getPackageById = (id: string): Package | undefined =>
  PACKAGES.find(p => p.id === id)

/**
 * Resolve a package for checkout/display, tolerating the retired 'comprehensive'
 * id from old links/bookings by falling back to Premium (its closest equivalent).
 * Never returns undefined, so callers don't have to special-case legacy ids.
 */
export const resolvePackage = (id: string | null | undefined): Package =>
  (id ? getPackageById(id) : undefined) ?? getPackageById('premium')!

/**
 * Travel pricing. Inspections in the nearer emirates are at the base package
 * price; the farther ones carry a flat travel surcharge. This is the single
 * source of truth — the checkout UI, the API and emails all derive the total
 * from here so the customer is never quoted one figure and charged another.
 */
export const TRAVEL_FEE = 100 // AED, flat

/** Locations that carry the flat travel surcharge. */
export const TRAVEL_FEE_EMIRATES: readonly Emirate[] = [
  'Abu Dhabi',
  'Al Ain',
  'Ras Al Khaimah',
  'Fujairah',
]

/** Travel surcharge for a given location (0 when none / not yet chosen). */
export const travelFeeForEmirate = (emirate: Emirate | ''): number =>
  emirate && TRAVEL_FEE_EMIRATES.includes(emirate) ? TRAVEL_FEE : 0

/** Total the customer pays = base package price + any travel surcharge. */
export const totalForPackage = (pkg: Package, emirate: Emirate | ''): number =>
  pkg.price + travelFeeForEmirate(emirate)

/**
 * Fixed daily inspection slots (one inspector, Asia/Dubai). The DB value is the
 * 24-hour slot start; the label is what customers see. The slot rules (long-
 * distance = 9:30 AM only + travel buffer, 1-hour minimum notice) are enforced
 * by the booking_slot_availability / create_booking_hold RPCs in the shared
 * Supabase project — this list only drives display and form options.
 */
export interface Slot {
  value: SlotTime
  label: string
}

export const SLOTS: Slot[] = [
  { value: '09:30', label: '9:30 AM' },
  { value: '11:45', label: '11:45 AM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '16:15', label: '4:15 PM' },
  { value: '18:30', label: '6:30 PM' },
]

/** Display label for a slot DB value (falls back to the raw value). */
export const slotLabel = (slot: string): string =>
  SLOTS.find((s) => s.value === slot)?.label ?? slot

export const isSlotTime = (s: string): s is SlotTime =>
  SLOTS.some((slot) => slot.value === s)

/** Distance class for an emirate: 'long' iff it carries the travel fee. */
export const distanceClassForEmirate = (emirate: Emirate | ''): DistanceClass =>
  emirate && TRAVEL_FEE_EMIRATES.includes(emirate) ? 'long' : 'normal'

// Note: the car make/model catalogue lives in lib/cars.ts (CAR_MAKES, MAKE_NAMES,
// modelsForMake) and the emirate list is defined where it's used (CheckoutForm,
// structured-data). Earlier duplicate copies here were removed to avoid drift.
