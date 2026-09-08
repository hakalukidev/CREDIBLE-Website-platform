import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageShell } from '@/components/layout/page-shell';
import { SearchResults, type SearchFilters } from '@/features/business/search-results';
import { SearchResultsBoundary } from './search-fallback';
import { breadcrumbSchema } from '@/lib/seo/structured-data';
import { JsonLd } from '@/components/static/json-ld';

// Search results depend on user filters and database state — never
// statically prerender this page.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Search',
  description: 'Search businesses and professionals on Credible.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchFilters>;
}) {
  // `searchParams` can be a Promise (Next 15+) or a plain object depending on
  // the runtime context. Handle both safely so a malformed value can't kill
  // the entire route.
  let sp: SearchFilters = {};
  try {
    sp = await searchParams;
  } catch {
    sp = {};
  }
  if (!sp || typeof sp !== 'object') sp = {};
  let jsonLdData: ReturnType<typeof breadcrumbSchema> | null = null;
  try {
    jsonLdData = breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Search', url: '/search' },
    ]);
  } catch {
    // JSON-LD failures must never break the page.
  }

  const title = sp.q ? `Results for “${sp.q}”` : 'Browse businesses';

  return (
    <>
      {jsonLdData && <JsonLd data={[jsonLdData]} />}

      <PageShell
        className="py-10"
        eyebrow="Directory"
        title={title}
        subtitle="Filter by category, location, minimum rating, and sort order."
      >
        <Suspense fallback={<SearchSkeleton />}>
          <SearchResultsBoundary>
            <SearchResults initial={sp} />
          </SearchResultsBoundary>
        </Suspense>
      </PageShell>
    </>
  );
}

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-2xl" />
      ))}
    </div>
  );
}
