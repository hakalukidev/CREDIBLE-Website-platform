/**
 * Visual smoke test — render the homepage JSON-LD block to stdout
 * so a developer can copy it into https://search.google.com/test/rich-results
 * and confirm Google sees the publisher graph.
 *
 *   pnpm tsx scripts/render-homepage-jsonld.ts
 */
import {
  organizationSchema,
  websiteSchemaWithSearchAction,
  webApplicationSchema,
} from '../src/lib/seo/structured-data.ts';

process.env.NEXT_PUBLIC_SITE_URL = 'https://credible.bd';

const blocks = [
  organizationSchema(),
  websiteSchemaWithSearchAction(),
  webApplicationSchema(),
];

console.log('--- HOMEPAGE JSON-LD OUTPUT (paste into Google Rich Results Test) ---');
for (const b of blocks) {
  console.log('\n<script type="application/ld+json">');
  console.log(JSON.stringify(b, null, 2));
  console.log('</script>');
}