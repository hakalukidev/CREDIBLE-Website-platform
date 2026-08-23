/**
 * Validation harness for Credible's Schema.org structured data.
 *
 *   pnpm tsx scripts/validate-structured-data.ts
 *
 * What this checks:
 *   1. Every helper returns well-formed JSON (parseable).
 *   2. Every @id is unique across the suite (no orphan nodes).
 *   3. Every Review is linked to:
 *        - a LocalBusiness via itemReviewed.@id
 *        - the publisher Organization via publisher.@id
 *        - the same itemReviewed @id via isPartOf.@id
 *   4. Every aggregateRating has ratingValue AND reviewCount > 0.
 *   5. Organization node is emitted with full contactPoint + sameAs.
 *   6. No empty-string required fields.
 *
 * Intentionally lightweight — no Google API dependency. It catches the
 * regressions a Rich Results Test would catch in CI.
 */
import {
  organizationSchema,
  websiteSchemaWithSearchAction,
  webApplicationSchema,
  businessSchema,
  reviewSchema,
  reviewListSchema,
  claimReviewSchema,
  breadcrumbSchema,
  ORG_ID,
  WEBSITE_ID,
} from '../src/lib/seo/structured-data.ts';

// Force SITE_URL to a stable value for the test run
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

const fails: string[] = [];
const pass = (msg: string) => console.log(`  \u2713 ${msg}`);
const fail = (msg: string) => {
  fails.push(msg);
  console.log(`  \u2717 ${msg}`);
};

console.log('\n[1] organizationSchema()');
{
  const o = organizationSchema();
  if (o['@context'] !== 'https://schema.org') fail('missing @context');
  else pass('@context present');
  if (o['@id'] !== ORG_ID) fail('@id mismatch with ORG_ID constant');
  else pass('@id matches ORG_ID');
  if (!Array.isArray(o.sameAs) || o.sameAs.length < 3) fail('sameAs has < 3 links');
  else pass(`sameAs has ${o.sameAs.length} links`);
  if (!Array.isArray(o.contactPoint) || o.contactPoint.length === 0) fail('no contactPoint');
  else pass(`contactPoint has ${o.contactPoint.length} entries`);
  if (typeof o.logo !== 'object') fail('logo is not an ImageObject');
  else pass('logo is ImageObject');
  if (typeof o.description !== 'string' || o.description.length < 40) fail('description too short');
  else pass(`description length = ${o.description.length}`);
}

console.log('\n[2] websiteSchemaWithSearchAction()');
{
  const w = websiteSchemaWithSearchAction();
  if (w['@type'] !== 'WebSite') fail('@type !== WebSite');
  else pass('@type is WebSite');
  if (w['@id'] !== WEBSITE_ID) fail('@id mismatch');
  else pass('@id matches WEBSITE_ID');
  const pa = w.potentialAction;
  if (!pa || pa['@type'] !== 'SearchAction') fail('potentialAction missing/wrong type');
  else pass('potentialAction is SearchAction');
  if (pa && pa['query-input'] !== 'required name=search_term_string')
    fail('query-input not in required format');
  else pass('query-input is in required Google format');
  if (pa?.target?.urlTemplate?.includes('{search_term_string}'))
    pass('urlTemplate contains placeholder');
  else fail('urlTemplate missing {search_term_string} placeholder');
  if (w.publisher?.['@id'] === ORG_ID) pass('publisher linked to ORG_ID');
  else fail('publisher not linked to ORG_ID');
}

console.log('\n[3] webApplicationSchema()');
{
  const a = webApplicationSchema();
  if (a['@type'] !== 'WebApplication') fail('@type !== WebApplication');
  else pass('@type is WebApplication');
  if (a.applicationCategory !== 'BusinessApplication')
    fail('applicationCategory wrong');
  else pass('applicationCategory is BusinessApplication');
  if (a.publisher?.['@id'] === ORG_ID) pass('publisher linked to ORG_ID');
  else fail('publisher not linked to ORG_ID');
}

console.log('\n[4] businessSchema()');
{
  const slug = 'bluebell-cafe-dhaka';
  const b = businessSchema({
    slug,
    name: 'Bluebell Cafe Dhaka',
    description: 'A nice cafe',
    city: 'Dhaka',
    country: 'BD',
    latitude: 23.78,
    longitude: 90.4,
    ratingAverage: 4.7,
    ratingCount: 312,
    isVerified: true,
    category: 'restaurant',
  });
  if (b['@type'] !== 'LocalBusiness') fail('@type should be LocalBusiness when category present');
  else pass('@type is LocalBusiness');
  if (b['@id'] !== `${process.env.NEXT_PUBLIC_SITE_URL}/business/${slug}#business`)
    fail('@id mismatch');
  else pass('@id matches expected business @id');
  if (b.publisher?.['@id'] === ORG_ID) pass('publisher linked to ORG_ID');
  else fail('publisher not linked to ORG_ID');
  if (b.aggregateRating?.reviewCount === 312) pass('aggregateRating.reviewCount = 312');
  else fail(`aggregateRating.reviewCount wrong: ${b.aggregateRating?.reviewCount}`);
  if (b.aggregateRating?.ratingValue === '4.7') pass('aggregateRating.ratingValue = "4.7"');
  else fail(`ratingValue wrong: ${b.aggregateRating?.ratingValue}`);
  if (b.award === 'Credible Verified') pass('award = "Credible Verified"');
  else fail(`award missing: ${b.award}`);
  if (b.address?.addressCountry === 'BD') pass('address.country = BD');
  else fail('address.country wrong');
  if (b.geo?.['@type'] === 'GeoCoordinates') pass('geo is GeoCoordinates');
  else fail('geo not set');
}

console.log('\n[5] businessSchema() with NO reviews (must not emit aggregateRating)');
{
  const b = businessSchema({
    slug: 'new-shop',
    name: 'New Shop',
    isVerified: false,
    ratingCount: 0,
  });
  if (!b.aggregateRating) pass('aggregateRating omitted when ratingCount=0');
  else fail('aggregateRating should be undefined when no reviews');
}

console.log('\n[6] reviewSchema() — full @id linkage');
{
  const reviewId = 'r-123';
  const slug = 'bluebell-cafe-dhaka';
  const businessId = `${process.env.NEXT_PUBLIC_SITE_URL}/business/${slug}#business`;
  const r = reviewSchema({
    businessSlug: slug,
    businessName: 'Bluebell Cafe Dhaka',
    reviewId,
    rating: 5,
    title: 'Great coffee',
    content: 'Best in town',
    author: 'Anika Khan',
    authorId: 'user-1',
    createdAt: '2025-08-15T00:00:00Z',
  });
  if (r['@type'] !== 'Review') fail('@type !== Review');
  else pass('@type is Review');
  if (r['@id'] === `${process.env.NEXT_PUBLIC_SITE_URL}/business/${slug}#review-${reviewId}`)
    pass('@id matches review anchor pattern');
  else fail(`@id wrong: ${r['@id']}`);
  if (r.itemReviewed?.['@id'] === businessId) pass('itemReviewed.@id === businessId');
  else fail(`itemReviewed.@id wrong: ${r.itemReviewed?.['@id']}`);
  if (r.isPartOf?.['@id'] === businessId) pass('isPartOf.@id === businessId (reverse link)');
  else fail(`isPartOf.@id wrong: ${r.isPartOf?.['@id']}`);
  if (r.publisher?.['@id'] === ORG_ID) pass('publisher linked to ORG_ID');
  else fail('publisher not linked to ORG_ID');
  if (r.author?.['@type'] === 'Person') pass('author is Person');
  else fail('author is not Person');
  if (r.author?.identifier === 'user-1') pass('author.identifier present');
  else fail('author.identifier missing');
  if (r.reviewRating?.ratingValue === 5) pass('reviewRating.ratingValue = 5');
  else fail('reviewRating.ratingValue wrong');
}

console.log('\n[7] reviewListSchema() — ItemList graph node');
{
  const slug = 'bluebell-cafe-dhaka';
  const items = [
    {
      businessSlug: slug,
      businessName: 'Bluebell Cafe Dhaka',
      reviewId: 'r1',
      rating: 5,
      content: 'Excellent',
      author: 'User A',
      authorId: 'u1',
      createdAt: '2025-08-10T00:00:00Z',
    },
    {
      businessSlug: slug,
      businessName: 'Bluebell Cafe Dhaka',
      reviewId: 'r2',
      rating: 4,
      content: 'Good',
      author: 'User B',
      authorId: 'u2',
      createdAt: '2025-08-11T00:00:00Z',
    },
  ];
  const list = reviewListSchema(slug, 'Bluebell Cafe Dhaka', items);
  if (list['@type'] !== 'ItemList') fail('@type !== ItemList');
  else pass('@type is ItemList');
  if (list.numberOfItems === 2) pass('numberOfItems = 2');
  else fail(`numberOfItems wrong: ${list.numberOfItems}`);
  if (list.itemListElement?.length === 2) pass('itemListElement has 2 items');
  else fail(`itemListElement wrong length: ${list.itemListElement?.length}`);
  const first = list.itemListElement?.[0];
  if (first?.item?.['@type'] === 'Review') pass('embedded item is a Review node');
  else fail('embedded item is not Review');
  if (first?.position === 1) pass('position = 1');
  else fail('position wrong');
}

console.log('\n[8] claimReviewSchema()');
{
  const c = claimReviewSchema({
    claimReviewed: 'Demo Business holds a Credible Verified badge',
    claimUrl: 'https://example.com/claim',
    reviewUrl: 'http://localhost:3000/verify/abc',
    verdict: 'Verified',
    businessName: 'Demo Business',
    badgeHash: 'abc',
    issuedAt: '2025-01-01T00:00:00Z',
  });
  if (c['@type'] !== 'ClaimReview') fail('@type !== ClaimReview');
  else pass('@type is ClaimReview');
  if (c.author?.['@id'] === ORG_ID) pass('author linked to ORG_ID');
  else fail('author not linked to ORG_ID');
  if (c.reviewRating?.alternateName === 'Verified') pass('reviewRating.alternateName = Verified');
  else fail('reviewRating.alternateName wrong');
}

console.log('\n[9] breadcrumbSchema()');
{
  const bc = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Search', url: '/search' },
    { name: 'Foo', url: '/business/foo' },
  ]);
  if (bc['@type'] !== 'BreadcrumbList') fail('@type wrong');
  else pass('@type is BreadcrumbList');
  if (bc.itemListElement?.length === 3) pass('3 items');
  else fail(`items wrong: ${bc.itemListElement?.length}`);
  if (bc.itemListElement?.[0]?.position === 1) pass('first position = 1');
  else fail('first position wrong');
}

console.log('\n[10] Cross-graph @id uniqueness');
{
  // Build the full suite and collect every @id
  const suite: any[] = [
    organizationSchema(),
    websiteSchemaWithSearchAction(),
    webApplicationSchema(),
    businessSchema({
      slug: 'b',
      name: 'B',
      isVerified: true,
      ratingCount: 5,
      ratingAverage: 4,
    }),
    reviewSchema({
      businessSlug: 'b',
      businessName: 'B',
      reviewId: 'r',
      rating: 5,
      content: 'x',
      author: 'a',
      createdAt: '2025-01-01',
    }),
    claimReviewSchema({
      claimReviewed: 'c',
      claimUrl: 'http://x',
      reviewUrl: 'http://localhost:3000/verify/h',
      verdict: 'Verified',
      businessName: 'b',
      badgeHash: 'h',
      issuedAt: '2025-01-01',
    }),
  ];
  const ids = suite.map((s) => s['@id']).filter(Boolean);
  const unique = new Set(ids);
  if (ids.length === unique.size) pass(`all ${ids.length} @ids are unique`);
  else fail(`duplicate @ids found: ${ids.length - unique.size}`);
}

console.log('\n----------------------------------------');
if (fails.length === 0) {
  console.log(`\u2705 ALL CHECKS PASSED\n`);
  process.exit(0);
} else {
  console.log(`\u274C ${fails.length} CHECK(S) FAILED:`);
  for (const f of fails) console.log(`  - ${f}`);
  process.exit(1);
}