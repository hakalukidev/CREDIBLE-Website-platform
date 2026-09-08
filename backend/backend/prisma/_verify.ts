import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

(async () => {
  const businesses = await p.business.findMany({
    where: { slug: { in: [
      'bistro-92',
      'sundarbans-eco-tours',
      'northend-dental-care',
      'pixelforge-studios',
      'old-dhaka-biryani-house',
    ]}},
    select: { displayName: true, slug: true, coverImage: true, city: true, status: true },
  });
  const professionals = await p.professional.findMany({
    where: { slug: { in: [
      'dr-anika-tabassum',
      'adv-rafsan-iqbal',
      'arch-sadia-haque',
      'ca-tanvir-chowdhury',
      'mahfuza-rahman',
      'engr-iftekhar-mahmud',
    ]}},
    select: { displayName: true, slug: true, coverImage: true, profession: true, status: true },
  });
  console.log('BUSINESSES:', businesses.length);
  businesses.forEach((b) => console.log(`  - ${b.displayName} (${b.city}) cover=${b.coverImage?.slice(0, 80)}…`));
  console.log('PROFESSIONALS:', professionals.length);
  professionals.forEach((p2) => console.log(`  - ${p2.displayName} (${p2.profession}) cover=${p2.coverImage?.slice(0, 80)}…`));
  process.exit(0);
})();
