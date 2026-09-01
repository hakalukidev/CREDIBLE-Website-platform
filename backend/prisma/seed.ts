import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/utils/password';
import { slugify, withRandomSuffix } from '@credible/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const seedPassword = process.env.SEED_PASSWORD ?? 'Password123!';
  if (process.env.NODE_ENV === 'production' && !process.env.SEED_PASSWORD) {
    throw new Error('SEED_PASSWORD must be set in production to avoid seeding with a known default password.');
  }
  const passwordHash = await hashPassword(seedPassword);

  // Admin user
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

  // Sample customer
  const customer = await prisma.user.upsert({
    where: { email: 'customer@credible.local' },
    update: {},
    create: {
      email: 'customer@credible.local',
      passwordHash,
      firstName: 'Camila',
      lastName: 'Reyes',
      role: 'CUSTOMER',
      emailVerifiedAt: new Date(),
    },
  });

  // Sample business owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner@credible.local' },
    update: {},
    create: {
      email: 'owner@credible.local',
      passwordHash,
      firstName: 'Sabbir',
      lastName: 'Rahman',
      role: 'BUSINESS',
      emailVerifiedAt: new Date(),
    },
  });

  // Categories
  const categories = await Promise.all(
    [
      { slug: 'restaurants', name: 'Restaurants' },
      { slug: 'legal', name: 'Legal Services' },
      { slug: 'health', name: 'Health & Wellness' },
      { slug: 'tech', name: 'IT & Software' },
      { slug: 'retail', name: 'Retail' },
    ].map((c) =>
      prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c }),
    ),
  );

  // Plans
  await prisma.subscriptionPlanInfo.upsert({
    where: { code: 'FREE' },
    update: {},
    create: {
      code: 'FREE',
      name: 'Free',
      priceMonthly: 0,
      priceYearly: 0,
      maxBusinesses: 1,
      maxReviews: 100,
      hasBadge: false,
    },
  });

  await prisma.subscriptionPlanInfo.upsert({
    where: { code: 'BASIC' },
    update: {},
    create: {
      code: 'BASIC',
      name: 'Basic',
      priceMonthly: 1500,
      priceYearly: 15000,
      maxBusinesses: 1,
      maxReviews: 1000,
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
      maxBusinesses: 5,
      maxReviews: 5000,
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
      maxBusinesses: 50,
      maxReviews: 50000,
      hasVerification: true,
      hasBadge: true,
      priority: 2,
    },
  });

  // Sample business
  let slug = slugify('Bluebell Cafe Dhaka');
  if (!slug) slug = `biz-${Date.now()}`;
  try {
    await prisma.business.create({
      data: {
        ownerId: owner.id,
        slug,
        legalName: 'Bluebell Cafe Ltd.',
        displayName: 'Bluebell Cafe Dhaka',
        description: 'Specialty coffee and pastries in Gulshan 2.',
        categoryId: categories[0].id,
        city: 'Dhaka',
        country: 'BD',
        yearEstablished: 2018,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        email: 'hello@bluebell.example',
        phone: '+8801700000000',
      },
    });
  } catch {
    // ignore duplicate slug
  }

  console.log('✅ Seed complete');
  console.log('   admin:', admin.email);
  console.log('   customer:', customer.email);
  console.log('   business owner:', owner.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());