// Single source of truth for the "Recently Inspected Cars" carousel.
//
// Each car maps its real photo (`image`) to a clean-slug inspection video
// (`video`) so the messy source filenames in /public/Videos (spaces, the
// "Nissan kicks .mov" trailing space) never leak into component code. The
// transcoded web MP4s live in /public/inspections.
//
// RECOMMENDATIONS are all client-confirmed (brief, 2026-06-16). SCORES are
// confirmed only for Nissan Maxima (44%) and Subaru WRX (62%) from the mockup;
// the rest are estimates aligned to each verdict and marked `// TODO real %`.
// Swap in the real numbers here and the whole section updates.

export type Recommendation = 'buy' | 'negotiate' | 'avoid'

export interface InspectedCar {
  slug: string
  make: string
  model: string
  /** Path under /public — the card thumbnail + video poster. */
  image: string
  /** Transcoded MP4 under /public/inspections. Omit when no video exists. */
  video?: string
  /** Crescent Score, 0–100, rendered as "NN%". */
  crescentScore: number
  recommendation: Recommendation
  /** Optional one-line headline finding. */
  finding?: string
}

export const INSPECTED_CARS: InspectedCar[] = [
  {
    slug: 'nissan-maxima',
    make: 'Nissan',
    model: 'Maxima',
    image: '/cars/Nissan Maxima.png',
    video: '/inspections/nissan-maxima.mp4',
    crescentScore: 44, // confirmed from client mockup
    recommendation: 'avoid', // confirmed from client mockup
  },
  {
    slug: 'subaru-wrx',
    make: 'Subaru',
    model: 'WRX',
    image: '/cars/Subaru WRX.png',
    // No inspection video supplied for this car.
    crescentScore: 62, // confirmed from client mockup
    recommendation: 'avoid', // confirmed from client mockup
  },
  {
    slug: 'bentley-continental',
    make: 'Bentley',
    model: 'Continental GT',
    image: '/cars/Bentley Continental.png',
    video: '/inspections/bentley-continental.mp4',
    crescentScore: 88, // TODO real %
    recommendation: 'buy', // client-confirmed
  },
  {
    slug: 'range-rover',
    make: 'Range Rover',
    model: 'Vogue',
    image: '/cars/Range Rover.png',
    video: '/inspections/range-rover.mp4',
    crescentScore: 66, // TODO real %
    recommendation: 'negotiate', // client-confirmed
  },
  {
    slug: 'dodge-challenger',
    make: 'Dodge',
    model: 'Challenger',
    image: '/cars/Dodge Challenger.png',
    video: '/inspections/dodge-challenger.mp4',
    crescentScore: 71, // TODO real %
    recommendation: 'negotiate', // client-confirmed
  },
  {
    slug: 'gmc-yukon',
    make: 'GMC',
    model: 'Yukon',
    image: '/cars/GMC Yukon.png',
    video: '/inspections/gmc-yukon.mp4',
    crescentScore: 84, // TODO real %
    recommendation: 'buy', // client-confirmed
  },
  {
    slug: 'mustang',
    make: 'Ford',
    model: 'Mustang',
    image: '/cars/Mustang.png',
    video: '/inspections/mustang.mp4',
    crescentScore: 47, // TODO real %
    recommendation: 'avoid', // client-confirmed
  },
  {
    slug: 'nissan-kicks',
    make: 'Nissan',
    model: 'Kicks',
    image: '/cars/Nissan Kicks.png',
    video: '/inspections/nissan-kicks.mp4',
    crescentScore: 53, // TODO real %
    recommendation: 'avoid', // client-confirmed
  },
]
