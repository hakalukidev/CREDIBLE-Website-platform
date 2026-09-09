// prisma/seed-abc.ts
//
// One-shot seed: creates an owner user (abc@gmail.com), one business
// and one professional under that same owner. Re-runnable — upserts on
// email/slug and skips if they already exist.
//
// Run:    npx tsx prisma/seed-abc.ts

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/utils/password';
import { slugify } from '@credible/shared';
import { generateBadgeHash } from '@credible/shared/utils/crypto';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
for (const p of [
  process.env.DOTENV_PATH,
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
].filter((x): x is string => Boolean(x))) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

const prisma = new PrismaClient();

const OWNER_EMAIL = 'abc@gmail.com';
const OWNER_PASSWORD = 'Abc@1234';

// Random Google usercontent URLs (same shape used in seed-10.ts / seed-demo.ts)
const GOOGLE_BUCKETS = [
  'ANXAkqA2RZ','ANXAkqB7RZ','ANXAkqC0RZ','ANXAkqD3RZ','ANXAkqF9RZ',
  'ANXAkqG5RZ','ANXAkqH9RZ','ANXAkqI0RZ','ANXAkqJ4RZ','ANXAkqK8RZ',
] as const;
function rand<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let s = '';
  for (let i = 0; i < 24; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function googleCoverUrl(seed: string): string {
  return `https://lh3.googleusercontent.com/places/${rand(GOOGLE_BUCKETS)}${randId()}-${seed.slice(0,4).toUpperCase()}=w1600-h900-k-no`;
}
function googleGallery(seed: string, count = 3): string[] {
  return Array.from({ length: count }, () => googleCoverUrl(seed));
}

async function main() {
  console.log('🌱 Seeding abc@gmail.com owner + 1 business + 1 professional…');

  const passwordHash = await hashPassword(OWNER_PASSWORD);

  // Categories — upsert so we have something to point at.
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

  // Subscription plans.
  await prisma.subscriptionPlanInfo.upsert({
    where: { code: 'FREE' }, update: {},
    create: { code: 'FREE', name: 'Free', priceMonthly: 0, priceYearly: 0, hasBadge: false },
  });
  await prisma.subscriptionPlanInfo.upsert({
    where: { code: 'BASIC' }, update: {},
    create: { code: 'BASIC', name: 'Basic', priceMonthly: 1500, priceYearly: 15000, hasVerification: true, hasBadge: true },
  });
  await prisma.subscriptionPlanInfo.upsert({
    where: { code: 'PROFESSIONAL' }, update: {},
    create: { code: 'PROFESSIONAL', name: 'Professional', priceMonthly: 3500, priceYearly: 35000, hasVerification: true, hasBadge: true, priority: 1 },
  });
  await prisma.subscriptionPlanInfo.upsert({
    where: { code: 'ENTERPRISE' }, update: {},
    create: { code: 'ENTERPRISE', name: 'Enterprise', priceMonthly: 9500, priceYearly: 95000, hasVerification: true, hasBadge: true, priority: 2 },
  });

  // Owner user. We give the user BOTH roles (BUSINESS + PROFESSIONAL) so the
  // same login can manage both a business profile and a professional profile.
  // `role` is a single enum so we pick BUSINESS — the backend models already
  // scope business/professional by the 1:1 relation to user, not by role.
  const owner = await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: { passwordHash },
    create: {
      email: OWNER_EMAIL,
      passwordHash,
      firstName: 'Abc',
      lastName: 'User',
      role: 'BUSINESS',
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`   ✅ owner user ready: ${owner.email} (id: ${owner.id})`);

  // ---------------------------------------------------------------------
  //  Business — "Abc Consulting Services"
  // ---------------------------------------------------------------------
  const bizSlugHint = 'Abc Consulting Services';
  const bizSlug = slugify(bizSlugHint) || `biz-${Date.now()}`;

  let business = await prisma.business.findUnique({ where: { slug: bizSlug } });
  if (business) {
    console.log(`   ↩︎  business skipped (exists): ${bizSlugHint}`);
  } else {
    const techCategory = categoryBySlug.get('tech')!;
    business = await prisma.business.create({
      data: {
        ownerId: owner.id,
        slug: bizSlug,
        legalName: 'Abc Consulting Services Ltd.',
        displayName: 'Abc Consulting Services',
        tagline: 'Strategy, technology and operations consulting',
        description:
          'Boutique management consulting firm helping SMEs streamline operations, adopt modern technology, and grow sustainably. Specialising in digital transformation, process optimisation, and change management across South Asia.',
        coverImage: googleCoverUrl(bizSlugHint),
        gallery: googleGallery(bizSlugHint, 4),
        categoryId: techCategory.id,
        city: 'Dhaka',
        country: 'BD',
        yearEstablished: 2020,
        employeeCount: '11-50',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        email: 'hello@abc-consulting.example',
        phone: '+8801711000301',
        website: 'https://abc-consulting.example',
        latitude: 23.78 + Math.random() * 0.1,
        longitude: 90.4 + Math.random() * 0.1,
        verificationStatus: 'APPROVED',
        verificationLevel: 'CERTIFIED',
        verifiedAt: new Date(),
        ratingAverage: 4.7,
        ratingCount: 4,
      },
    });

    // Subscription
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await prisma.subscription.create({
      data: {
        userId: owner.id,
        businessId: business.id,
        plan: 'PROFESSIONAL',
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        amount: 3500,
        autoRenew: true,
      },
    });

    // Verification application + badge
    await prisma.verificationApplication.create({
      data: {
        businessId: business.id,
        status: 'APPROVED',
        level: 'CERTIFIED',
        appliedAt: new Date(),
        reviewedAt: new Date(),
      },
    });

    const badgeHash = generateBadgeHash();
    await prisma.business.update({
      where: { id: business.id },
      data: { badgeHash, badgeIssuedAt: new Date() },
    });
    await prisma.badge.create({
      data: {
        badgeId: badgeHash,
        businessId: business.id,
        type: 'CERTIFIED',
        verificationUrl: `${process.env.WEB_URL ?? 'http://localhost:3000'}/verify/${badgeHash}`,
        issuedAt: new Date(),
        isActive: true,
      },
    });

    console.log(`   ✅ business created: ${business.displayName} (${bizSlug})`);
  }

  // ---------------------------------------------------------------------
  //  Professional — "Abc Rahman, Chartered Accountant"
  // ---------------------------------------------------------------------
  const proSlugHint = 'Abc Rahman';
  const proSlug = slugify(proSlugHint) || `pro-${Date.now()}`;

  let professional = await prisma.professional.findUnique({ where: { slug: proSlug } });
  if (professional) {
    console.log(`   ↩︎  professional skipped (exists): ${proSlugHint}`);
  } else {
    const legalCategory = categoryBySlug.get('legal')!;
    professional = await prisma.professional.create({
      data: {
        ownerId: owner.id,
        slug: proSlug,
        title: 'CA',
        displayName: 'Abc Rahman',
        headline: 'Chartered Accountant — tax, audit and SME advisory',
        bio: 'ICAB-registered chartered accountant with 10+ years of experience advising SMEs on tax, statutory audit, VAT compliance and corporate finance. Pragmatic, plain-English advice for founders.',
        avatar: googleCoverUrl(`${proSlugHint}-avatar`),
        coverImage: googleCoverUrl(proSlugHint),
        profession: 'Chartered Accountant',
        specialties: ['Tax Filing', 'Statutory Audit', 'VAT Compliance', 'SME Advisory'],
        languages: ['Bangla', 'English'],
        yearsOfExperience: 10,
        categoryId: legalCategory.id,
        city: 'Dhaka',
        country: 'BD',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        email: 'abc.rahman@example.com',
        phone: '+8801711000302',
        website: 'https://abc-rahman.example',
        verificationStatus: 'APPROVED',
        verificationLevel: 'CERTIFIED',
        verifiedAt: new Date(),
        ratingAverage: 4.8,
        ratingCount: 3,
      },
    });

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await prisma.subscription.create({
      data: {
        userId: owner.id,
        professionalId: professional.id,
        plan: 'PROFESSIONAL',
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        amount: 3500,
        autoRenew: true,
      },
    });

    await prisma.verificationApplication.create({
      data: {
        professionalId: professional.id,
        status: 'APPROVED',
        level: 'CERTIFIED',
        appliedAt: new Date(),
        reviewedAt: new Date(),
      },
    });

    const badgeHash = generateBadgeHash();
    await prisma.professional.update({
      where: { id: professional.id },
      data: { badgeHash, badgeIssuedAt: new Date() },
    });
    await prisma.badge.create({
      data: {
        badgeId: badgeHash,
        professionalId: professional.id,
        type: 'CERTIFIED',
        verificationUrl: `${process.env.WEB_URL ?? 'http://localhost:3000'}/verify/${badgeHash}`,
        issuedAt: new Date(),
        isActive: true,
      },
    });

    console.log(`   ✅ professional created: ${professional.displayName} (${proSlug})`);
  }

  console.log(`\n🎉 Done. Login: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  console.log(`   Business URL:     /business/${bizSlug}`);
  console.log(`   Professional URL: /professionals/${proSlug}`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
