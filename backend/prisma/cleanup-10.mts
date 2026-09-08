// prisma/cleanup-10.mts
//
// One-shot cleanup for the bulk-seeded businesses (used while iterating on
// the seed-10.ts script). Deletes the 10 seeded businesses and their owners
// so seed-10.ts can be re-run from a clean slate.
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const candidatePaths = [
  process.env.DOTENV_PATH,
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
].filter((p): p is string => Boolean(p));
for (const p of candidatePaths) {
  if (fs.existsSync(p)) { dotenv.config({ path: p }); break; }
}

const prisma = new PrismaClient();

const slugs = [
  'bluebell-cafe-dhaka','haque-associates-law','greenleaf-wellness-clinic',
  'bytestack-solutions','heritage-books-chattogram','karim-plumbing-services',
  'spice-route-restaurant','mindful-yoga-studio','techrepair-hub','sunrise-driving-school',
];

for (const slug of slugs) {
  const b = await prisma.business.findUnique({ where: { slug } });
  if (!b) continue;
  await prisma.review.deleteMany({ where: { businessId: b.id } });
  await prisma.contactRequest.deleteMany({ where: { businessId: b.id } });
  await prisma.badge.deleteMany({ where: { businessId: b.id } });
  await prisma.subscription.deleteMany({ where: { businessId: b.id } });
  await prisma.verificationApplication.deleteMany({ where: { businessId: b.id } });
  await prisma.business.delete({ where: { id: b.id } });
  await prisma.user.delete({ where: { id: b.ownerId } }).catch(() => {});
  console.log('cleaned', slug);
}

await prisma.$disconnect();
