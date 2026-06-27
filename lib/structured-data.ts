export function getLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Crescent Car Check',
    description: 'Professional pre-purchase car inspection service across the UAE.',
    // Fall back to the same constants as components/layout/Footer.tsx so the
    // JSON-LD never emits `undefined` when these env vars are unset.
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://crescentcarcheck.com',
    telephone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || '+971 502526314',
    email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'crescentcarcheck@gmail.com',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AE',
      addressRegion: 'Sharjah',
    },
    areaServed: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Al Ain'],
    priceRange: 'AED 299 to AED 399',
    openingHours: 'Mo-Su 09:00-20:00',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Car Inspection Packages',
      itemListElement: [
        { '@type': 'Offer', name: 'Standard Inspection', price: '299', priceCurrency: 'AED' },
        { '@type': 'Offer', name: 'Premium Inspection', price: '399', priceCurrency: 'AED' },
      ],
    },
  }
}
