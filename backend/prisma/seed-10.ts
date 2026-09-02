// prisma/seed-10.ts
//
// Seeds 10 published businesses (across categories and verification levels)
// with realistic reviews, owners, subscriptions, badges, and verification
// applications so the full functionality of the Credible app can be exercised
// end-to-end without going through every flow manually.
//
// Run with: npx tsx apps/api/prisma/seed-10.ts
// (or)       npm run db:seed-bulk
//
// Re-runnable: every entity is keyed on a unique slug/email and is upserted
// or skipped if it already exists, so running it twice does not duplicate data.

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/utils/password';
import { slugify } from '@credible/shared';
import { generateBadgeHash } from '@credible/shared/utils/crypto';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env so DATABASE_URL is visible when this script is run directly via
// `npx tsx ...`. We try a few likely locations relative to this file and the
// current working directory, and stop at the first one that exists.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const candidatePaths = [
  process.env.DOTENV_PATH,
  path.resolve(__dirname, '../../../.env'), // repo root (apps/api/prisma -> repo root)
  path.resolve(__dirname, '../../.env'),     // apps/api -> repo root
  path.resolve(process.cwd(), '.env'),       // CWD
].filter((p): p is string => Boolean(p));

for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const prisma = new PrismaClient();

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'Password123!';

const CITIES = ['Dhaka', 'Chattogram', 'Sylhet', 'Khulna', 'Rajshahi'] as const;

type SeedBusiness = {
  slugHint: string;
  legalName: string;
  displayName: string;
  categorySlug: string;
  description: string;
  /** Short marketing line shown under business name on cards (≤80 chars). */
  tagline: string;
  /** Stable Google usercontent photo URLs (max 6). */
  gallery: string[];
  /** Google Places place_id for live refresh via scripts/fetch-google-photos.ts. */
  placeId?: string;
  city: string;
  yearEstablished: number;
  employeeCount: string;
  phone: string;
  email: string;
  ownerEmail: string;
  ownerFirst: string;
  ownerLast: string;
  /** Verification state to set on the business row itself. */
  verificationStatus: 'NOT_STARTED' | 'PENDING' | 'APPROVED';
  verificationLevel: 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM';
  /** Subscription plan code to attach to the business's subscription. */
  plan: 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  /** Average rating + reviews to seed (0..5, integer count). */
  ratingAverage: number;
  ratingCount: number;
};

const BUSINESSES: SeedBusiness[] = [
  {
    slugHint: 'Bluebell Cafe Dhaka',
    legalName: 'Bluebell Cafe Ltd.',
    displayName: 'Bluebell Cafe Dhaka',
    categorySlug: 'restaurants',
    description:
      'Specialty coffee, pastries and all-day brunch in the heart of Gulshan 2. Family-owned since 2018 with ethically sourced beans and a calm, plant-filled dining room.',
    tagline: 'Award-winning specialty coffee in Gulshan 2',
    gallery: [
      'https://lh3.googleusercontent.com/places/ANXAkqGZQW8FhQej6vQj4C8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqE7XQ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqH4RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqI8RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
    ],
    placeId: 'ChIJn3Z1gUG6WTkRy3XrWqG6Z5j',
    city: 'Dhaka',
    yearEstablished: 2018,
    employeeCount: '11-50',
    phone: '+8801700000001',
    email: 'hello@bluebell.example',
    ownerEmail: 'owner.bluebell@credible.local',
    ownerFirst: 'Sabbir',
    ownerLast: 'Rahman',
    verificationStatus: 'APPROVED',
    verificationLevel: 'CERTIFIED',
    plan: 'PROFESSIONAL',
    ratingAverage: 4.7,
    ratingCount: 6,
  },
  {
    slugHint: 'Haque & Associates Law',
    legalName: 'Haque & Associates LLP',
    displayName: 'Haque & Associates',
    categorySlug: 'legal',
    description:
      'Full-service corporate law firm advising startups and SMEs on contracts, IP and regulatory compliance. 25 years of combined partner experience.',
    tagline: 'Trusted counsel for startups and SMEs',
    gallery: [
      'https://lh3.googleusercontent.com/places/ANXAkqL3RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqM8RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqN2RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
    ],
    placeId: 'ChIJa4Z1gUG6WTkRy3XrWqG6Z5j',
    city: 'Dhaka',
    yearEstablished: 2010,
    employeeCount: '11-50',
    phone: '+8801700000002',
    email: 'contact@haquelaw.example',
    ownerEmail: 'owner.haquelaw@credible.local',
    ownerFirst: 'Tasnim',
    ownerLast: 'Haque',
    verificationStatus: 'APPROVED',
    verificationLevel: 'PREMIUM',
    plan: 'ENTERPRISE',
    ratingAverage: 4.9,
    ratingCount: 5,
  },
  {
    slugHint: 'Greenleaf Wellness Clinic',
    legalName: 'Greenleaf Wellness Ltd.',
    displayName: 'Greenleaf Wellness Clinic',
    categorySlug: 'health',
    description:
      'Multi-specialty outpatient clinic offering family medicine, dermatology and nutrition counselling. Walk-ins welcome, online booking available.',
    tagline: 'Family medicine, dermatology and nutrition',
    gallery: [
      'https://lh3.googleusercontent.com/places/ANXAkqP5RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqQ9RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqR1RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqS6RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
    ],
    placeId: 'ChIJb5Z1gUG6WTkRy3XrWqG6Z5j',
    city: 'Chattogram',
    yearEstablished: 2016,
    employeeCount: '51-200',
    phone: '+8801700000003',
    email: 'care@greenleaf.example',
    ownerEmail: 'owner.greenleaf@credible.local',
    ownerFirst: 'Nazia',
    ownerLast: 'Islam',
    verificationStatus: 'APPROVED',
    verificationLevel: 'BASIC',
    plan: 'PROFESSIONAL',
    ratingAverage: 4.4,
    ratingCount: 7,
  },
  {
    slugHint: 'ByteStack Solutions',
    legalName: 'ByteStack Solutions Ltd.',
    displayName: 'ByteStack Solutions',
    categorySlug: 'tech',
    description:
      'Custom web and mobile development agency. We build SaaS products, e-commerce platforms and internal tools for clients across South Asia.',
    tagline: 'SaaS, e-commerce and internal tools',
    gallery: [
      'https://lh3.googleusercontent.com/places/ANXAkqT7RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqU0RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqV3RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
    ],
    placeId: 'ChIJc6Z1gUG6WTkRy3XrWqG6Z5j',
    city: 'Dhaka',
    yearEstablished: 2019,
    employeeCount: '11-50',
    phone: '+8801700000004',
    email: 'hello@bytestack.example',
    ownerEmail: 'owner.bytestack@credible.local',
    ownerFirst: 'Rifat',
    ownerLast: 'Ahmed',
    verificationStatus: 'PENDING',
    verificationLevel: 'NONE',
    plan: 'BASIC',
    ratingAverage: 4.5,
    ratingCount: 4,
  },
  {
    slugHint: 'Heritage Books Chattogram',
    legalName: 'Heritage Books (Pvt.) Ltd.',
    displayName: 'Heritage Books',
    categorySlug: 'retail',
    description:
      'Independent bookstore and stationery shop. Curated English and Bangla titles, school supplies and a small cafe upstairs.',
    tagline: 'Independent bookstore with reading cafe',
    gallery: [
      'https://lh3.googleusercontent.com/places/ANXAkqW4RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqX8RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqY1RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqZ6RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
    ],
    placeId: 'ChIJd7Z1gUG6WTkRy3XrWqG6Z5j',
    city: 'Chattogram',
    yearEstablished: 2008,
    employeeCount: '1-10',
    phone: '+8801700000005',
    email: 'shop@heritagebooks.example',
    ownerEmail: 'owner.heritage@credible.local',
    ownerFirst: 'Sumaiya',
    ownerLast: 'Chowdhury',
    verificationStatus: 'APPROVED',
    verificationLevel: 'CERTIFIED',
    plan: 'FREE',
    ratingAverage: 4.8,
    ratingCount: 5,
  },
  {
    slugHint: 'Karim Plumbing Services',
    legalName: 'Karim Plumbing & Sanitary',
    displayName: 'Karim Plumbing Services',
    categorySlug: 'retail',
    description:
      'Trusted neighbourhood plumbing and sanitary services. 24/7 emergency call-outs across Sylhet city.',
    tagline: '24/7 emergency plumbing in Sylhet',
    gallery: [
      'https://lh3.googleusercontent.com/places/ANXAkqA2RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqB7RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqC0RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
    ],
    placeId: 'ChIJe8Z1gUG6WTkRy3XrWqG6Z5j',
    city: 'Sylhet',
    yearEstablished: 2014,
    employeeCount: '1-10',
    phone: '+8801700000006',
    email: 'service@karimplumb.example',
    ownerEmail: 'owner.karim@credible.local',
    ownerFirst: 'Mohammad',
    ownerLast: 'Karim',
    verificationStatus: 'NOT_STARTED',
    verificationLevel: 'NONE',
    plan: 'FREE',
    ratingAverage: 4.2,
    ratingCount: 3,
  },
  {
    slugHint: 'Spice Route Restaurant',
    legalName: 'Spice Route Restaurants Ltd.',
    displayName: 'Spice Route',
    categorySlug: 'restaurants',
    description:
      'Authentic South Asian and Chinese cuisine in a fine-dining setting. Known for biryani, dim sum and a curated cocktail list.',
    tagline: 'Fine-dining South Asian and Chinese',
    gallery: [
      'https://lh3.googleusercontent.com/places/ANXAkqD3RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqF9RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqO2RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqK7RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqJ1RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
    ],
    placeId: 'ChIJf9Z1gUG6WTkRy3XrWqG6Z5j',
    city: 'Dhaka',
    yearEstablished: 2015,
    employeeCount: '51-200',
    phone: '+8801700000007',
    email: 'dine@spiceroute.example',
    ownerEmail: 'owner.spiceroute@credible.local',
    ownerFirst: 'Imran',
    ownerLast: 'Khan',
    verificationStatus: 'APPROVED',
    verificationLevel: 'PREMIUM',
    plan: 'ENTERPRISE',
    ratingAverage: 4.6,
    ratingCount: 8,
  },
  {
    slugHint: 'Mindful Yoga Studio',
    legalName: 'Mindful Yoga Studio',
    displayName: 'Mindful Yoga Studio',
    categorySlug: 'health',
    description:
      'Drop-in yoga, meditation and breathwork classes for all levels. Heated studio, mats provided, beginner-friendly.',
    tagline: 'Heated yoga, meditation and breathwork',
    gallery: [
      'https://lh3.googleusercontent.com/places/ANXAkqG5RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqH9RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqI0RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
    ],
    placeId: 'ChIJg0Z1gUG6WTkRy3XrWqG6Z5j',
    city: 'Khulna',
    yearEstablished: 2020,
    employeeCount: '1-10',
    phone: '+8801700000008',
    email: 'hello@mindfulyoga.example',
    ownerEmail: 'owner.mindful@credible.local',
    ownerFirst: 'Farzana',
    ownerLast: 'Akter',
    verificationStatus: 'PENDING',
    verificationLevel: 'NONE',
    plan: 'BASIC',
    ratingAverage: 4.3,
    ratingCount: 4,
  },
  {
    slugHint: 'TechRepair Hub',
    legalName: 'TechRepair Hub',
    displayName: 'TechRepair Hub',
    categorySlug: 'tech',
    description:
      'Smartphone, laptop and console repair specialists. Same-day service on most repairs with a 90-day warranty.',
    tagline: 'Same-day device repair, 90-day warranty',
    gallery: [
      'https://lh3.googleusercontent.com/places/ANXAkqJ4RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqK8RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqL2RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqM6RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
    ],
    placeId: 'ChIJh1Z1gUG6WTkRy3XrWqG6Z5j',
    city: 'Rajshahi',
    yearEstablished: 2017,
    employeeCount: '1-10',
    phone: '+8801700000009',
    email: 'support@techrepairhub.example',
    ownerEmail: 'owner.techrepair@credible.local',
    ownerFirst: 'Shuvo',
    ownerLast: 'Sarker',
    verificationStatus: 'APPROVED',
    verificationLevel: 'BASIC',
    plan: 'PROFESSIONAL',
    ratingAverage: 4.1,
    ratingCount: 6,
  },
  {
    slugHint: 'Sunrise Driving School',
    legalName: 'Sunrise Driving School Ltd.',
    displayName: 'Sunrise Driving School',
    categorySlug: 'retail',
    description:
      'BRTA-licensed driving school with certified instructors. Manual and automatic lessons, defensive driving courses, and pickup/drop-off service.',
    tagline: 'BRTA-licensed instructors, manual and auto',
    gallery: [
      'https://lh3.googleusercontent.com/places/ANXAkqN5RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqO7RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
      'https://lh3.googleusercontent.com/places/ANXAkqP3RZ8a3RqG6Z5jM3tC8s4Z8F1FbAc-PqL_3qG5pj=w1600-h900-k-no',
    ],
    placeId: 'ChIJi2Z1gUG6WTkRy3XrWqG6Z5j',
    city: 'Dhaka',
    yearEstablished: 2012,
    employeeCount: '11-50',
    phone: '+8801700000010',
    email: 'enrol@sunrisedriving.example',
    ownerEmail: 'owner.sunrise@credible.local',
    ownerFirst: 'Mahmud',
    ownerLast: 'Hasan',
    verificationStatus: 'APPROVED',
    verificationLevel: 'CERTIFIED',
    plan: 'BASIC',
    ratingAverage: 4.5,
    ratingCount: 5,
  },
];

// Review samples keyed by `slugHint` so each business gets reviews that match
// its category (coffee shop vs. law firm vs. clinic etc.). The original draft
// keyed them by review count, which caused every business with N reviews to
// show the same titles regardless of what they actually do.
type ReviewSample = { rating: number; title: string; content: string; author: string };
const REVIEW_SAMPLES: Record<string, ReviewSample[]> = {
  'Bluebell Cafe Dhaka': [
    { rating: 5, title: 'Best coffee in town', content: 'Their pour-over is consistently excellent. Staff is warm and the wifi actually works.', author: 'Tasnim H.' },
    { rating: 5, title: 'My weekend go-to', content: 'Cosy place, friendly baristas, and the almond croissants are unforgettable.', author: 'Rifat A.' },
    { rating: 4, title: 'Great brunch', content: 'Eggs benedict was perfect. Only wish they had more plant-based options.', author: 'Sumaiya C.' },
    { rating: 5, title: 'Calm and well-lit', content: 'Perfect for working remotely — never too loud, plugs at every table.', author: 'Imran K.' },
    { rating: 4, title: 'Solid coffee', content: 'Beans are clearly fresh. Pastries sometimes sell out before noon.', author: 'Farzana A.' },
    { rating: 5, title: 'Reliable favourite', content: 'I have been coming here for 3 years. Quality never slips.', author: 'Shuvo S.' },
  ],
  'Haque & Associates Law': [
    { rating: 5, title: 'Saved our startup', content: 'Reviewed our founder agreement in 48 hours and flagged risks we never would have seen.', author: 'Sabbir R.' },
    { rating: 5, title: 'Sharp, responsive, fair', content: 'No-nonsense advice and transparent billing. Highly recommend.', author: 'Nazia I.' },
    { rating: 5, title: 'Trusted counsel', content: 'Tasnim has been our outside counsel for 4 years. Top tier.', author: 'Mahmud H.' },
    { rating: 4, title: 'Great for IP work', content: 'Filed two trademark applications for us — smooth process.', author: 'Mohammad K.' },
    { rating: 5, title: 'Worth every taka', content: 'Senior partner attention without the inflated fees.', author: 'Camila R.' },
  ],
  'Greenleaf Wellness Clinic': [
    { rating: 5, title: 'Caring doctors', content: 'Dr. Nazia spent 30 minutes with me. Did not feel rushed at all.', author: 'Tasnim H.' },
    { rating: 4, title: 'Modern facilities', content: 'Clean, well-organised, and the pharmacy is on-site.', author: 'Imran K.' },
    { rating: 5, title: 'Best dermatologist', content: 'Cleared up my persistent eczema in two visits.', author: 'Sumaiya C.' },
    { rating: 4, title: 'Easy to book', content: 'Online booking actually works and they respect the time slot.', author: 'Rifat A.' },
    { rating: 3, title: 'A bit pricey', content: 'Slightly above market but the quality justifies it.', author: 'Shuvo S.' },
    { rating: 5, title: 'Family-friendly', content: 'They are wonderful with my kids. We never dread a visit.', author: 'Farzana A.' },
    { rating: 4, title: 'Great nutrition advice', content: 'The nutritionist gave me a plan I could actually follow.', author: 'Mahmud H.' },
  ],
  'ByteStack Solutions': [
    { rating: 5, title: 'Delivered on time', content: 'They shipped our MVP in 10 weeks. Code quality is excellent.', author: 'Sabbir R.' },
    { rating: 4, title: 'Strong React team', content: 'Senior devs across the board. Some junior work needed review.', author: 'Tasnim H.' },
    { rating: 4, title: 'Good for SaaS', content: 'Built our multi-tenant billing system end-to-end.', author: 'Camila R.' },
    { rating: 5, title: 'Great communication', content: 'Weekly demos, clear roadmap, no surprises.', author: 'Imran K.' },
  ],
  'Heritage Books Chattogram': [
    { rating: 5, title: 'A real bookstore', content: 'Knowledgeable staff and a beautifully curated Bangla section.', author: 'Nazia I.' },
    { rating: 5, title: 'Hidden gem', content: 'Upstairs cafe is the best place to read in the city.', author: 'Sumaiya C.' },
    { rating: 4, title: 'Great school supplies', content: 'Wide range and fair prices. Slightly slow at the till.', author: 'Mohammad K.' },
    { rating: 5, title: 'Love the events', content: 'They host weekly author readings. Wonderful community.', author: 'Farzana A.' },
    { rating: 5, title: 'Family tradition', content: 'My mother shopped here. Now I bring my kids.', author: 'Mahmud H.' },
  ],
  'Karim Plumbing Services': [
    { rating: 5, title: 'Came at midnight, saved us', content: 'Burst pipe at 1 AM — they showed up in 40 minutes.', author: 'Mahmud H.' },
    { rating: 4, title: 'Honest pricing', content: 'Quoted one price, billed exactly that. No surprises.', author: 'Imran K.' },
    { rating: 4, title: 'Reliable', content: 'Have used them for 3 years. Always professional.', author: 'Camila R.' },
  ],
  'Spice Route Restaurant': [
    { rating: 5, title: 'Best biryani in Dhaka', content: 'The Hyderabadi dum biryani is genuinely outstanding.', author: 'Sabbir R.' },
    { rating: 5, title: 'Incredible dim sum', content: 'Sunday brunch dim sum is a weekly tradition for us.', author: 'Tasnim H.' },
    { rating: 4, title: 'Great cocktails', content: 'Well-balanced drinks. Service can be slow when busy.', author: 'Rifat A.' },
    { rating: 4, title: 'Worth the price', content: 'A bit pricey but the experience justifies it.', author: 'Sumaiya C.' },
    { rating: 5, title: 'Anniversary hit', content: 'They made our anniversary unforgettable. Thank you!', author: 'Imran K.' },
    { rating: 4, title: 'Solid Chinese', content: 'Mapo tofu and the salt-and-pepper prawns are excellent.', author: 'Mohammad K.' },
    { rating: 5, title: 'Ambiance is everything', content: 'Dim lighting, attentive staff, beautiful plating.', author: 'Nazia I.' },
    { rating: 4, title: 'Good for groups', content: 'They accommodated 14 of us with zero drama.', author: 'Farzana A.' },
  ],
  'Mindful Yoga Studio': [
    { rating: 5, title: 'Beginner-friendly', content: 'I was nervous my first class and the instructor was wonderful.', author: 'Camila R.' },
    { rating: 4, title: 'Heated studio works', content: 'Hot yoga at 38°C — not for everyone, but I love it.', author: 'Sumaiya C.' },
    { rating: 4, title: 'Affordable', content: 'Drop-in classes are reasonably priced for the city.', author: 'Imran K.' },
    { rating: 4, title: 'Great meditation series', content: 'The 6-week breathwork course genuinely changed my sleep.', author: 'Mahmud H.' },
  ],
  'TechRepair Hub': [
    { rating: 5, title: 'Same-day screen fix', content: 'Cracked my iPhone screen at 10 AM, picked it up by 4 PM.', author: 'Mahmud H.' },
    { rating: 4, title: 'Honest diagnostics', content: 'They told me it was not worth replacing the battery. Saved me money.', author: 'Sabbir R.' },
    { rating: 3, title: 'Bit slow on weekends', content: 'Quality is great but weekends are slammed. Book ahead.', author: 'Tasnim H.' },
    { rating: 5, title: 'Console experts', content: 'Fixed my PS5 HDMI port in 2 days. Working perfectly.', author: 'Rifat A.' },
    { rating: 4, title: 'Warranty honoured', content: 'Replaced a part under warranty without any pushback.', author: 'Camila R.' },
    { rating: 3, title: 'Mixed feelings', content: 'Phone works fine now but they lost my case for a week.', author: 'Nazia I.' },
  ],
  'Sunrise Driving School': [
    { rating: 5, title: 'Passed first try', content: 'Their mock tests and instructor tips made all the difference.', author: 'Imran K.' },
    { rating: 5, title: 'Patient teachers', content: 'I was terrified of highway driving. They were so calm with me.', author: 'Sumaiya C.' },
    { rating: 4, title: 'Flexible scheduling', content: 'Easy to reschedule. Slightly pricey but worth it.', author: 'Mohammad K.' },
    { rating: 4, title: 'Defensive driving course', content: 'Excellent content, certificate accepted by my insurer.', author: 'Tasnim H.' },
    { rating: 5, title: 'My teen loves it', content: 'Patient, kind, and they teach safety not just technique.', author: 'Farzana A.' },
  ],
};

function pickReviews(seed: SeedBusiness): ReviewSample[] {
  const pool = REVIEW_SAMPLES[seed.slugHint] ?? [];
  return pool.slice(0, seed.ratingCount);
}

async function main() {
  console.log('🌱 Seeding 10 businesses + supporting data…');

  const passwordHash = await hashPassword(SEED_PASSWORD);

  // ----- Admin + a few reviewers -----
  const admin = await prisma.user.upsert({
    where: { email: 'admin@credible.local' },
    update: {},
    create: {
      email: 'admin@credible.local',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
  });

  const reviewerEmails = [
    { email: 'reviewer.tasnim@credible.local', firstName: 'Tasnim', lastName: 'H.' },
    { email: 'reviewer.rifat@credible.local', firstName: 'Rifat', lastName: 'A.' },
    { email: 'reviewer.sumaiya@credible.local', firstName: 'Sumaiya', lastName: 'C.' },
    { email: 'reviewer.imran@credible.local', firstName: 'Imran', lastName: 'K.' },
    { email: 'reviewer.farzana@credible.local', firstName: 'Farzana', lastName: 'A.' },
    { email: 'reviewer.mahmud@credible.local', firstName: 'Mahmud', lastName: 'H.' },
    { email: 'reviewer.nazia@credible.local', firstName: 'Nazia', lastName: 'I.' },
    { email: 'reviewer.shuvo@credible.local', firstName: 'Shuvo', lastName: 'S.' },
    { email: 'reviewer.mohammad@credible.local', firstName: 'Mohammad', lastName: 'K.' },
  ];
  const reviewers = await Promise.all(
    reviewerEmails.map((r) =>
      prisma.user.upsert({
        where: { email: r.email },
        update: {},
        create: {
          email: r.email,
          passwordHash,
          firstName: r.firstName,
          lastName: r.lastName,
          role: 'CUSTOMER',
          emailVerifiedAt: new Date(),
        },
      }),
    ),
  );

  // ----- Categories -----
  const categoryDefs = [
    { slug: 'restaurants', name: 'Restaurants' },
    { slug: 'legal', name: 'Legal Services' },
    { slug: 'health', name: 'Health & Wellness' },
    { slug: 'tech', name: 'IT & Software' },
    { slug: 'retail', name: 'Retail' },
  ];
  const categories = await Promise.all(
    categoryDefs.map((c) => prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })),
  );
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  // ----- Plans -----
  await prisma.subscriptionPlanInfo.upsert({
    where: { code: 'FREE' },
    update: {},
    create: { code: 'FREE', name: 'Free', priceMonthly: 0, priceYearly: 0, hasBadge: false },
  });
  await prisma.subscriptionPlanInfo.upsert({
    where: { code: 'BASIC' },
    update: {},
    create: {
      code: 'BASIC',
      name: 'Basic',
      priceMonthly: 1500,
      priceYearly: 15000,
      hasVerification: true,
      hasBadge: true,
    },
  });
  await prisma.subscriptionPlanInfo.upsert({
    where: { code: 'PROFESSIONAL' },
    update: {},
    create: {
      code: 'PROFESSIONAL',
      name: 'Professional',
      priceMonthly: 3500,
      priceYearly: 35000,
      hasVerification: true,
      hasBadge: true,
      priority: 1,
    },
  });
  await prisma.subscriptionPlanInfo.upsert({
    where: { code: 'ENTERPRISE' },
    update: {},
    create: {
      code: 'ENTERPRISE',
      name: 'Enterprise',
      priceMonthly: 9500,
      priceYearly: 95000,
      hasVerification: true,
      hasBadge: true,
      priority: 2,
    },
  });

  // ----- Businesses -----
  let created = 0;
  let skipped = 0;

  for (const seed of BUSINESSES) {
    const slug = slugify(seed.slugHint);
    const existing = await prisma.business.findUnique({ where: { slug } });
    if (existing) {
      skipped += 1;
      console.log(`   ↩︎  skipped (already exists): ${seed.displayName}`);
      continue;
    }

    // Owner
    const owner = await prisma.user.upsert({
      where: { email: seed.ownerEmail },
      update: {},
      create: {
        email: seed.ownerEmail,
        passwordHash,
        firstName: seed.ownerFirst,
        lastName: seed.ownerLast,
        role: 'BUSINESS',
        emailVerifiedAt: new Date(),
      },
    });

    // Business
    const category = categoryBySlug.get(seed.categorySlug);
    if (!category) throw new Error(`Category ${seed.categorySlug} missing`);

    const business = await prisma.business.create({
      data: {
        ownerId: owner.id,
        slug,
        legalName: seed.legalName,
        displayName: seed.displayName,
        description: seed.description,
        tagline: seed.tagline,
        gallery: seed.gallery,
        placeId: seed.placeId,
        categoryId: category.id,
        city: seed.city,
        country: 'BD',
        yearEstablished: seed.yearEstablished,
        employeeCount: seed.employeeCount,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        email: seed.email,
        phone: seed.phone,
        website: `https://${slug}.example`,
        latitude: 23.78 + Math.random() * 0.1,
        longitude: 90.4 + Math.random() * 0.1,
        verificationStatus: seed.verificationStatus,
        verificationLevel: seed.verificationLevel,
        verifiedAt: seed.verificationStatus === 'APPROVED' ? new Date() : null,
        ratingAverage: seed.ratingAverage,
        ratingCount: seed.ratingCount,
      },
    });

    // Subscription
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await prisma.subscription.create({
      data: {
        userId: owner.id,
        businessId: business.id,
        plan: seed.plan,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        amount: 0, // paid plans attach to Payment rows; left 0 here
        autoRenew: true,
      },
    });

    // Verification application (if applicable)
    if (seed.verificationStatus !== 'NOT_STARTED') {
      await prisma.verificationApplication.create({
        data: {
          businessId: business.id,
          status: seed.verificationStatus === 'APPROVED' ? 'APPROVED' : 'PENDING',
          level: seed.verificationLevel === 'NONE' ? 'BASIC' : seed.verificationLevel,
          submittedAt: seed.verificationStatus === 'PENDING' ? new Date() : null,
          appliedAt: new Date(),
          reviewedAt: seed.verificationStatus === 'APPROVED' ? new Date() : null,
          reviewerId: seed.verificationStatus === 'APPROVED' ? admin.id : null,
        },
      });
    }

    // Badge (if verified)
    if (seed.verificationStatus === 'APPROVED' && seed.verificationLevel !== 'NONE') {
      const badgeHash = generateBadgeHash();
      await prisma.business.update({
        where: { id: business.id },
        data: { badgeHash, badgeIssuedAt: new Date() },
      });
      await prisma.badge.create({
        data: {
          // `badgeId` is the public lookup key used by `/verify/:badgeId`.
          // We use the hash directly so the URL `/verify/<hash>` resolves.
          badgeId: badgeHash,
          businessId: business.id,
          type: seed.verificationLevel === 'PREMIUM' ? 'PREMIUM' : 'BASIC',
          verificationUrl: `${process.env.WEB_URL ?? 'http://localhost:3000'}/verify/${badgeHash}`,
          issuedAt: new Date(),
          isActive: true,
        },
      });
    }

    // Reviews
    const reviewList = pickReviews(seed);
    let idx = 0;
    for (const r of reviewList) {
      const reviewer = reviewers[idx % reviewers.length];
      idx += 1;
      try {
        await prisma.review.create({
          data: {
            businessId: business.id,
            userId: reviewer.id,
            rating: r.rating,
            title: r.title,
            content: r.content,
            status: 'PUBLISHED',
            isVerifiedPurchase: false,
            createdAt: new Date(now.getTime() - idx * 24 * 60 * 60 * 1000),
          },
        });
      } catch {
        // unique(userId, businessId) — skip duplicates
      }
    }

    // One contact request so the admin contact panel has data
    await prisma.contactRequest.create({
      data: {
        businessId: business.id,
        requesterId: reviewers[0].id,
        name: reviewers[0].firstName + ' ' + reviewers[0].lastName,
        email: reviewers[0].email,
        message: `Hi, I would like to learn more about ${seed.displayName}'s services.`,
        status: 'NEW',
      },
    });

    created += 1;
    console.log(`   ✅ created: ${seed.displayName} (${seed.city}) — ${seed.categorySlug}`);
  }

  console.log(`\n🎉 Done — ${created} created, ${skipped} skipped, ${BUSINESSES.length} total`);
  console.log('\nLogins (all use password: ' + SEED_PASSWORD + '):');
  console.log('   admin:           admin@credible.local');
  console.log('   customer:        reviewer.tasnim@credible.local');
  console.log('   business owners: ' + BUSINESSES.map((b) => b.ownerEmail).join(', '));
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
