// prisma/seed-demo.ts
//
// Seeds a fresh batch of demo businesses + professionals with random Google
// cover-image URLs. Re-runnable: every entity is keyed on a unique slug/email
// and is upserted or skipped if it already exists.
//
// Usage:   npx tsx prisma/seed-demo.ts
//      or  npm run seed:demo
//
// Produces at minimum 10 profiles (mix of Business and Professional).

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/utils/password';
import { slugify } from '@credible/shared';
import { generateBadgeHash } from '@credible/shared/utils/crypto';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env so DATABASE_URL is visible when this script is run directly.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const candidatePaths = [
  process.env.DOTENV_PATH,
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
].filter((p): p is string => Boolean(p));

for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const prisma = new PrismaClient();

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'Password123!';

const CITIES = ['Dhaka', 'Chattogram', 'Sylhet', 'Khulna', 'Rajshahi', 'Barishal', 'Rangpur'];

// ---------------------------------------------------------------------------
// Random Google cover-image generator
// ---------------------------------------------------------------------------
// We use the publicly cached `lh3.googleusercontent.com/places/...` URL shape
// that the existing seed-10.ts already relies on. Each URL is randomised by
// picking a fresh short-id segment so that even if two profiles collide on
// the same base, the actual image fetched by the browser differs.
const GOOGLE_BUCKETS = [
  'ANXAkqA2RZ', 'ANXAkqB7RZ', 'ANXAkqC0RZ', 'ANXAkqD3RZ', 'ANXAkqF9RZ',
  'ANXAkqG5RZ', 'ANXAkqH9RZ', 'ANXAkqI0RZ', 'ANXAkqJ4RZ', 'ANXAkqK8RZ',
  'ANXAkqL2RZ', 'ANXAkqM6RZ', 'ANXAkqN5RZ', 'ANXAkqO7RZ', 'ANXAkqP3RZ',
  'ANXAkqQ1RZ', 'ANXAkqR6RZ', 'ANXAkqS2RZ', 'ANXAkqT7RZ', 'ANXAkqU0RZ',
  'ANXAkqV3RZ', 'ANXAkqW4RZ', 'ANXAkqX8RZ', 'ANXAkqY1RZ', 'ANXAkqZ6RZ',
  'ANXAkqA7RZ', 'ANXAkqB1RZ', 'ANXAkqC9RZ', 'ANXAkqD0RZ', 'ANXAkqE5RZ',
  'ANXAkqF4RZ', 'ANXAkqG8RZ', 'ANXAkqH3RZ', 'ANXAkqI9RZ', 'ANXAkqJ2RZ',
  'ANXAkqK0RZ', 'ANXAkqL6RZ', 'ANXAkqM4RZ', 'ANXAkqN8RZ', 'ANXAkqO3RZ',
] as const;

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randId(): string {
  // 24-char alphanumeric, similar to Google's short-id shape
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let s = '';
  for (let i = 0; i < 24; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function googleCoverUrl(seed: string): string {
  const bucket = rand(GOOGLE_BUCKETS);
  // Shape mirrors seed-10.ts so existing image-loading code paths continue to
  // work; `seed` is mixed in to make the URL deterministic per call.
  return `https://lh3.googleusercontent.com/places/${bucket}${randId()}-${seed.slice(0, 4).toUpperCase()}=w1600-h900-k-no`;
}

function googleGallery(seed: string, count = 3): string[] {
  return Array.from({ length: count }, () => googleCoverUrl(seed));
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

type SeedBusiness = {
  slugHint: string;
  legalName: string;
  displayName: string;
  categorySlug: string;
  description: string;
  tagline: string;
  city: string;
  yearEstablished: number;
  employeeCount: string;
  phone: string;
  email: string;
  ownerEmail: string;
  ownerFirst: string;
  ownerLast: string;
  verificationStatus: 'NOT_STARTED' | 'PENDING' | 'APPROVED';
  verificationLevel: 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM';
  plan: 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  ratingAverage: number;
  ratingCount: number;
};

type SeedProfessional = {
  slugHint: string;
  displayName: string;
  title: string;
  profession: string;
  headline: string;
  bio: string;
  specialties: string[];
  languages: string[];
  yearsOfExperience: number;
  city: string;
  phone: string;
  email: string;
  ownerEmail: string;
  ownerFirst: string;
  ownerLast: string;
  categorySlug: string;
  verificationStatus: 'NOT_STARTED' | 'PENDING' | 'APPROVED';
  verificationLevel: 'NONE' | 'BASIC' | 'CERTIFIED' | 'PREMIUM';
  plan: 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';
  ratingAverage: number;
  ratingCount: number;
};

const BUSINESSES: SeedBusiness[] = [
  {
    slugHint: 'Bistro 92 Uttara',
    legalName: 'Bistro 92 Ltd.',
    displayName: 'Bistro 92',
    categorySlug: 'restaurants',
    description:
      'Modern European bistro in Uttara serving seasonal small plates, wood-fired pizzas and a tightly curated wine list.',
    tagline: 'Seasonal European small plates & wood-fired pizza',
    city: 'Dhaka',
    yearEstablished: 2019,
    employeeCount: '11-50',
    phone: '+8801711000092',
    email: 'hello@bistro92.example',
    ownerEmail: 'owner.bistro92@credible.local',
    ownerFirst: 'Tanvir',
    ownerLast: 'Hossain',
    verificationStatus: 'APPROVED',
    verificationLevel: 'CERTIFIED',
    plan: 'PROFESSIONAL',
    ratingAverage: 4.6,
    ratingCount: 5,
  },
  {
    slugHint: 'Sundarbans Eco Tours',
    legalName: 'Sundarbans Eco Tours Ltd.',
    displayName: 'Sundarbans Eco Tours',
    categorySlug: 'retail',
    description:
      'Licensed eco-tour operator running 3-day and 5-day boat safaris into the Sundarbans mangrove forest with naturalist guides.',
    tagline: 'Licensed boat safaris into the Sundarbans',
    city: 'Khulna',
    yearEstablished: 2014,
    employeeCount: '11-50',
    phone: '+8801711000093',
    email: 'tours@sundarbans-eco.example',
    ownerEmail: 'owner.sundarbans@credible.local',
    ownerFirst: 'Rebeka',
    ownerLast: 'Sultana',
    verificationStatus: 'APPROVED',
    verificationLevel: 'PREMIUM',
    plan: 'ENTERPRISE',
    ratingAverage: 4.9,
    ratingCount: 6,
  },
  {
    slugHint: 'NorthEnd Dental Care',
    legalName: 'NorthEnd Dental Care',
    displayName: 'NorthEnd Dental Care',
    categorySlug: 'health',
    description:
      'Family dental clinic offering routine check-ups, cosmetic dentistry, orthodontics and same-day emergency care.',
    tagline: 'Family dentistry, orthodontics & emergency care',
    city: 'Rajshahi',
    yearEstablished: 2017,
    employeeCount: '11-50',
    phone: '+8801711000094',
    email: 'smile@northenddental.example',
    ownerEmail: 'owner.northend@credible.local',
    ownerFirst: 'Dr. Ashfaq',
    ownerLast: 'Rahman',
    verificationStatus: 'PENDING',
    verificationLevel: 'NONE',
    plan: 'BASIC',
    ratingAverage: 4.4,
    ratingCount: 4,
  },
  {
    slugHint: 'PixelForge Studios',
    legalName: 'PixelForge Studios Ltd.',
    displayName: 'PixelForge Studios',
    categorySlug: 'tech',
    description:
      'Boutique design + development studio focused on brand identity, web experiences and product UI for fintech and SaaS clients.',
    tagline: 'Brand, web & product UI for fintech & SaaS',
    city: 'Dhaka',
    yearEstablished: 2021,
    employeeCount: '1-10',
    phone: '+8801711000095',
    email: 'studio@pixelforge.example',
    ownerEmail: 'owner.pixelforge@credible.local',
    ownerFirst: 'Nusrat',
    ownerLast: 'Jahan',
    verificationStatus: 'APPROVED',
    verificationLevel: 'BASIC',
    plan: 'PROFESSIONAL',
    ratingAverage: 4.7,
    ratingCount: 5,
  },
  {
    slugHint: 'Old Dhaka Biryani House',
    legalName: 'Old Dhaka Biryani House',
    displayName: 'Old Dhaka Biryani House',
    categorySlug: 'restaurants',
    description:
      'Third-generation family kitchen specialising in traditional Dhaka-style kacchi biryani. Dine-in and catering only — no delivery.',
    tagline: 'Third-generation Dhaka-style kacchi biryani',
    city: 'Dhaka',
    yearEstablished: 2003,
    employeeCount: '11-50',
    phone: '+8801711000096',
    email: 'dine@olddakhabiryani.example',
    ownerEmail: 'owner.olddakha@credible.local',
    ownerFirst: 'Khaled',
    ownerLast: 'Mia',
    verificationStatus: 'NOT_STARTED',
    verificationLevel: 'NONE',
    plan: 'FREE',
    ratingAverage: 4.5,
    ratingCount: 4,
  },
];

const PROFESSIONALS: SeedProfessional[] = [
  {
    slugHint: 'Dr. Anika Tabassum',
    displayName: 'Dr. Anika Tabassum',
    title: 'Dr.',
    profession: 'Cardiologist',
    headline: 'Consultant Cardiologist, 14 years of clinical practice',
    bio: 'Consultant cardiologist focusing on non-invasive cardiology, hypertension management and preventive heart care. MBBS, MD (Cardiology), attached to United Hospital.',
    specialties: ['Echocardiography', 'Hypertension', 'Preventive Cardiology', 'ECG'],
    languages: ['Bangla', 'English', 'Hindi'],
    yearsOfExperience: 14,
    city: 'Dhaka',
    phone: '+8801711000201',
    email: 'clinic@dr-anika.example',
    ownerEmail: 'owner.dr.anika@credible.local',
    ownerFirst: 'Anika',
    ownerLast: 'Tabassum',
    categorySlug: 'health',
    verificationStatus: 'APPROVED',
    verificationLevel: 'PREMIUM',
    plan: 'PROFESSIONAL',
    ratingAverage: 4.9,
    ratingCount: 6,
  },
  {
    slugHint: 'Adv. Rafsan Iqbal',
    displayName: 'Adv. Rafsan Iqbal',
    title: 'Adv.',
    profession: 'Lawyer',
    headline: 'Advocate, Supreme Court of Bangladesh',
    bio: 'Civil and commercial litigation advocate. Practice areas include contract disputes, land and tenancy, and arbitration. Member of the Bangladesh Bar Council.',
    specialties: ['Civil Litigation', 'Contract Law', 'Arbitration', 'Land & Tenancy'],
    languages: ['Bangla', 'English'],
    yearsOfExperience: 11,
    city: 'Dhaka',
    phone: '+8801711000202',
    email: 'office@adv-rafsan.example',
    ownerEmail: 'owner.adv.rafsan@credible.local',
    ownerFirst: 'Rafsan',
    ownerLast: 'Iqbal',
    categorySlug: 'legal',
    verificationStatus: 'APPROVED',
    verificationLevel: 'CERTIFIED',
    plan: 'BASIC',
    ratingAverage: 4.7,
    ratingCount: 5,
  },
  {
    slugHint: 'Arch. Sadia Haque',
    displayName: 'Arch. Sadia Haque',
    title: 'Arch.',
    profession: 'Architect',
    headline: 'Licensed architect — residential and small commercial',
    bio: 'Licensed architect designing context-sensitive residential and small commercial projects. IeB-registered, 9 years in practice.',
    specialties: ['Residential Design', 'Sustainable Architecture', 'Renovation', 'Interior Layout'],
    languages: ['Bangla', 'English'],
    yearsOfExperience: 9,
    city: 'Chattogram',
    phone: '+8801711000203',
    email: 'studio@arch-sadia.example',
    ownerEmail: 'owner.arch.sadia@credible.local',
    ownerFirst: 'Sadia',
    ownerLast: 'Haque',
    categorySlug: 'tech',
    verificationStatus: 'APPROVED',
    verificationLevel: 'BASIC',
    plan: 'BASIC',
    ratingAverage: 4.6,
    ratingCount: 4,
  },
  {
    slugHint: 'CA Tanvir Chowdhury',
    displayName: 'CA Tanvir Chowdhury',
    title: 'CA',
    profession: 'Chartered Accountant',
    headline: 'Chartered Accountant — tax, audit and corporate advisory',
    bio: 'ICAB-registered chartered accountant providing tax filing, statutory audit and SME corporate advisory. 12 years across audit and advisory practices.',
    specialties: ['Tax Filing', 'Statutory Audit', 'Corporate Advisory', 'VAT'],
    languages: ['Bangla', 'English'],
    yearsOfExperience: 12,
    city: 'Dhaka',
    phone: '+8801711000204',
    email: 'office@ca-tanvir.example',
    ownerEmail: 'owner.ca.tanvir@credible.local',
    ownerFirst: 'Tanvir',
    ownerLast: 'Chowdhury',
    categorySlug: 'legal',
    verificationStatus: 'PENDING',
    verificationLevel: 'NONE',
    plan: 'FREE',
    ratingAverage: 4.5,
    ratingCount: 3,
  },
  {
    slugHint: 'Psych. Mahfuza Rahman',
    displayName: 'Mahfuza Rahman',
    title: 'Mahfuza',
    profession: 'Psychologist',
    headline: 'Clinical psychologist — CBT, anxiety & adolescent mental health',
    bio: 'Clinical psychologist (MPhil, Clinical Psychology) with a private practice focused on CBT, anxiety disorders, and adolescent mental health. Online sessions available.',
    specialties: ['CBT', 'Anxiety', 'Adolescent Mental Health', 'Stress Management'],
    languages: ['Bangla', 'English'],
    yearsOfExperience: 7,
    city: 'Sylhet',
    phone: '+8801711000205',
    email: 'sessions@mahfuza-r.example',
    ownerEmail: 'owner.mahfuza@credible.local',
    ownerFirst: 'Mahfuza',
    ownerLast: 'Rahman',
    categorySlug: 'health',
    verificationStatus: 'APPROVED',
    verificationLevel: 'CERTIFIED',
    plan: 'PROFESSIONAL',
    ratingAverage: 4.8,
    ratingCount: 5,
  },
  {
    slugHint: 'Engr. Iftekhar Mahmud',
    displayName: 'Iftekhar Mahmud',
    title: 'Engr.',
    profession: 'Civil Engineer',
    headline: 'Structural engineer — residential & mid-rise commercial',
    bio: 'IEB-licensed civil/structural engineer with 16 years of experience in residential and mid-rise commercial structural design and site supervision.',
    specialties: ['Structural Design', 'Site Supervision', 'Retrofitting', 'Earthquake-resistant Design'],
    languages: ['Bangla', 'English'],
    yearsOfExperience: 16,
    city: 'Khulna',
    phone: '+8801711000206',
    email: 'office@engr-iftekhar.example',
    ownerEmail: 'owner.engr.iftekhar@credible.local',
    ownerFirst: 'Iftekhar',
    ownerLast: 'Mahmud',
    categorySlug: 'tech',
    verificationStatus: 'NOT_STARTED',
    verificationLevel: 'NONE',
    plan: 'FREE',
    ratingAverage: 4.3,
    ratingCount: 3,
  },
];

const REVIEW_TEMPLATES: Record<string, { rating: number; title: string; content: string; author: string }[]> = {
  default: [
    { rating: 5, title: 'Highly recommended', content: 'Excellent service from start to finish. Will definitely come back.', author: 'Sabbir R.' },
    { rating: 4, title: 'Great experience', content: 'Solid work, friendly team, and reasonable pricing.', author: 'Tasnim H.' },
    { rating: 5, title: 'Worth every taka', content: 'I had a great experience and would recommend to friends and family.', author: 'Imran K.' },
    { rating: 4, title: 'Good, with room to improve', content: 'Overall positive. A small wait time but worth it.', author: 'Sumaiya C.' },
    { rating: 5, title: 'Five stars', content: 'Polite, professional, and they actually follow up after the service.', author: 'Farzana A.' },
    { rating: 4, title: 'Reliable', content: 'Used them twice now — both times went smoothly.', author: 'Mahmud H.' },
  ],
};

function pickReviews(count: number): { rating: number; title: string; content: string; author: string }[] {
  const pool = REVIEW_TEMPLATES.default;
  return pool.slice(0, count);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 Seeding demo businesses + professionals…');

  const passwordHash = await hashPassword(SEED_PASSWORD);

  // Admin + a small reviewer pool
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

  // Categories
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

  // Plans (idempotent — may already exist from other seeds)
  await prisma.subscriptionPlanInfo.upsert({
    where: { code: 'FREE' },
    update: {},
    create: { code: 'FREE', name: 'Free', priceMonthly: 0, priceYearly: 0, hasBadge: false },
  });
  await prisma.subscriptionPlanInfo.upsert({
    where: { code: 'BASIC' },
    update: {},
    create: {
      code: 'BASIC', name: 'Basic', priceMonthly: 1500, priceYearly: 15000,
      hasVerification: true, hasBadge: true,
    },
  });
  await prisma.subscriptionPlanInfo.upsert({
    where: { code: 'PROFESSIONAL' },
    update: {},
    create: {
      code: 'PROFESSIONAL', name: 'Professional', priceMonthly: 3500, priceYearly: 35000,
      hasVerification: true, hasBadge: true, priority: 1,
    },
  });
  await prisma.subscriptionPlanInfo.upsert({
    where: { code: 'ENTERPRISE' },
    update: {},
    create: {
      code: 'ENTERPRISE', name: 'Enterprise', priceMonthly: 9500, priceYearly: 95000,
      hasVerification: true, hasBadge: true, priority: 2,
    },
  });

  let created = 0;
  let skipped = 0;

  // -------------------------------------------------------------------------
  // Businesses
  // -------------------------------------------------------------------------
  for (const seed of BUSINESSES) {
    const slug = slugify(seed.slugHint);
    const existing = await prisma.business.findUnique({ where: { slug } });
    if (existing) {
      skipped += 1;
      console.log(`   ↩︎  business skipped (exists): ${seed.displayName}`);
      continue;
    }

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

    const category = categoryBySlug.get(seed.categorySlug);
    if (!category) throw new Error(`Category ${seed.categorySlug} missing`);

    const coverImage = googleCoverUrl(seed.slugHint);
    const gallery = googleGallery(seed.slugHint, 3);

    const business = await prisma.business.create({
      data: {
        ownerId: owner.id,
        slug,
        legalName: seed.legalName,
        displayName: seed.displayName,
        description: seed.description,
        tagline: seed.tagline,
        coverImage,
        gallery,
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
        amount: 0,
        autoRenew: true,
      },
    });

    // Verification application + badge if applicable
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

    if (seed.verificationStatus === 'APPROVED' && seed.verificationLevel !== 'NONE') {
      const badgeHash = generateBadgeHash();
      await prisma.business.update({
        where: { id: business.id },
        data: { badgeHash, badgeIssuedAt: new Date() },
      });
      await prisma.badge.create({
        data: {
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
    const reviewList = pickReviews(seed.ratingCount);
    let idx = 0;
    for (const r of reviewList) {
      const reviewer = reviewers[idx % reviewers.length];
      idx += 1;
      try {
        await prisma.review.create({
          data: {
            businessId: business.id,
            userId: reviewer.id,
            targetType: 'BUSINESS',
            rating: r.rating,
            title: r.title,
            content: r.content,
            status: 'PUBLISHED',
            isVerifiedPurchase: false,
            createdAt: new Date(now.getTime() - idx * 24 * 60 * 60 * 1000),
          },
        });
      } catch {
        // ignore unique-constraint duplicates
      }
    }

    // Contact request
    await prisma.contactRequest.create({
      data: {
        businessId: business.id,
        requesterId: reviewers[0].id,
        name: `${reviewers[0].firstName} ${reviewers[0].lastName}`,
        email: reviewers[0].email,
        message: `Hi, I would like to learn more about ${seed.displayName}'s services.`,
        status: 'NEW',
      },
    });

    created += 1;
    console.log(`   ✅ business created: ${seed.displayName} (${seed.city})`);
  }

  // -------------------------------------------------------------------------
  // Professionals
  // -------------------------------------------------------------------------
  for (const seed of PROFESSIONALS) {
    const slug = slugify(seed.slugHint);
    const existing = await prisma.professional.findUnique({ where: { slug } });
    if (existing) {
      skipped += 1;
      console.log(`   ↩︎  professional skipped (exists): ${seed.displayName}`);
      continue;
    }

    const owner = await prisma.user.upsert({
      where: { email: seed.ownerEmail },
      update: {},
      create: {
        email: seed.ownerEmail,
        passwordHash,
        firstName: seed.ownerFirst,
        lastName: seed.ownerLast,
        role: 'PROFESSIONAL',
        emailVerifiedAt: new Date(),
      },
    });

    const category = categoryBySlug.get(seed.categorySlug);
    if (!category) throw new Error(`Category ${seed.categorySlug} missing`);

    const coverImage = googleCoverUrl(seed.slugHint);
    const avatar = googleCoverUrl(`${seed.slugHint}-avatar`);

    const professional = await prisma.professional.create({
      data: {
        ownerId: owner.id,
        slug,
        title: seed.title,
        displayName: seed.displayName,
        headline: seed.headline,
        bio: seed.bio,
        coverImage,
        avatar,
        profession: seed.profession,
        specialties: seed.specialties,
        languages: seed.languages,
        yearsOfExperience: seed.yearsOfExperience,
        categoryId: category.id,
        city: seed.city,
        country: 'BD',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        email: seed.email,
        phone: seed.phone,
        website: `https://${slug}.example`,
        verificationStatus: seed.verificationStatus,
        verificationLevel: seed.verificationLevel,
        verifiedAt: seed.verificationStatus === 'APPROVED' ? new Date() : null,
        ratingAverage: seed.ratingAverage,
        ratingCount: seed.ratingCount,
      },
    });

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await prisma.subscription.create({
      data: {
        userId: owner.id,
        professionalId: professional.id,
        plan: seed.plan,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        amount: 0,
        autoRenew: true,
      },
    });

    if (seed.verificationStatus !== 'NOT_STARTED') {
      await prisma.verificationApplication.create({
        data: {
          professionalId: professional.id,
          status: seed.verificationStatus === 'APPROVED' ? 'APPROVED' : 'PENDING',
          level: seed.verificationLevel === 'NONE' ? 'BASIC' : seed.verificationLevel,
          submittedAt: seed.verificationStatus === 'PENDING' ? new Date() : null,
          appliedAt: new Date(),
          reviewedAt: seed.verificationStatus === 'APPROVED' ? new Date() : null,
          reviewerId: seed.verificationStatus === 'APPROVED' ? admin.id : null,
        },
      });
    }

    if (seed.verificationStatus === 'APPROVED' && seed.verificationLevel !== 'NONE') {
      const badgeHash = generateBadgeHash();
      await prisma.professional.update({
        where: { id: professional.id },
        data: { badgeHash, badgeIssuedAt: new Date() },
      });
      await prisma.badge.create({
        data: {
          badgeId: badgeHash,
          professionalId: professional.id,
          type: seed.verificationLevel === 'PREMIUM' ? 'PREMIUM' : 'BASIC',
          verificationUrl: `${process.env.WEB_URL ?? 'http://localhost:3000'}/verify/${badgeHash}`,
          issuedAt: new Date(),
          isActive: true,
        },
      });
    }

    const reviewList = pickReviews(seed.ratingCount);
    let idx = 0;
    for (const r of reviewList) {
      const reviewer = reviewers[idx % reviewers.length];
      idx += 1;
      try {
        await prisma.review.create({
          data: {
            professionalId: professional.id,
            userId: reviewer.id,
            targetType: 'PROFESSIONAL',
            rating: r.rating,
            title: r.title,
            content: r.content,
            status: 'PUBLISHED',
            isVerifiedPurchase: false,
            createdAt: new Date(now.getTime() - idx * 24 * 60 * 60 * 1000),
          },
        });
      } catch {
        // ignore unique-constraint duplicates
      }
    }

    created += 1;
    console.log(`   ✅ professional created: ${seed.displayName} (${seed.profession})`);
  }

  const totalTarget = BUSINESSES.length + PROFESSIONALS.length;
  console.log(`\n🎉 Done — ${created} created, ${skipped} skipped, ${totalTarget} target`);
  console.log(`\nLogin password (all accounts): ${SEED_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
