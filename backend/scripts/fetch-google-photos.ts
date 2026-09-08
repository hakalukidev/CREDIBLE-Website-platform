/**
 * Backfill `Business.gallery` for a business by Google `placeId`.
 *
 * Usage:
 *   npx tsx scripts/fetch-google-photos.ts --slug bluebell-cafe-dhaka
 *   npx tsx scripts/fetch-google-photos.ts --place-id ChIJ...
 *   npx tsx scripts/fetch-google-photos.ts --all                # process every business with a placeId
 *   npx tsx scripts/fetch-google-photos.ts --slug ... --force  # overwrite an existing gallery
 *
 * Requires `GOOGLE_PLACES_API_KEY` in `.env`. Skips businesses that already
 * have a gallery unless `--force` is passed.
 */

import { prisma } from '../src/lib/db/prisma';
import { fetchPlacePhotos } from '../src/lib/google-places';
import { env } from '../src/config/env';

interface Args {
  slug?: string;
  placeId?: string;
  all?: boolean;
  force?: boolean;
  count?: number;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    switch (a) {
      case '--slug':
        args.slug = next;
        i++;
        break;
      case '--place-id':
        args.placeId = next;
        i++;
        break;
      case '--all':
        args.all = true;
        break;
      case '--force':
        args.force = true;
        break;
      case '--count':
        args.count = Number(next);
        i++;
        break;
      default:
        // ignore
        break;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.slug && !args.placeId && !args.all) {
    console.error('Pass one of --slug, --place-id, or --all');
    process.exit(1);
  }
  if (!env.GOOGLE_PLACES_API_KEY) {
    console.error('GOOGLE_PLACES_API_KEY is not set in backend/.env');
    process.exit(1);
  }

  const where = args.slug
    ? { slug: args.slug }
    : args.placeId
      ? { placeId: args.placeId }
      : { placeId: { not: null } };

  const businesses = await prisma.business.findMany({ where });
  if (businesses.length === 0) {
    console.log('No matching businesses.');
    return;
  }

  let processed = 0;
  let updated = 0;
  let skipped = 0;

  for (const b of businesses) {
    processed++;
    if (!b.placeId) {
      console.log(`  [skip] ${b.slug} — no placeId`);
      skipped++;
      continue;
    }
    if (!args.force && Array.isArray(b.gallery) && (b.gallery as string[]).length > 0) {
      console.log(`  [skip] ${b.slug} — gallery already populated (use --force to overwrite)`);
      skipped++;
      continue;
    }
    try {
      const urls = await fetchPlacePhotos(b.placeId, args.count ?? 6);
      if (urls.length === 0) {
        console.log(`  [empty] ${b.slug} — Google returned 0 photos for placeId ${b.placeId}`);
        skipped++;
        continue;
      }
      await prisma.business.update({
        where: { id: b.id },
        data: { gallery: urls },
      });
      console.log(`  [ok]    ${b.slug} — saved ${urls.length} photo URL(s)`);
      updated++;
    } catch (err) {
      console.error(`  [fail]  ${b.slug} — ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\nDone. processed=${processed} updated=${updated} skipped=${skipped}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());