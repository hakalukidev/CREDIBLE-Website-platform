import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchResults } from '@/features/business/search-results';
import { SearchResultsBoundary } from './search-fallback';
import { breadcrumbSchema } from '@/lib/seo/structured-data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

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
  searchParams: Promise<{ q?: string; category?: string; city?: string; verified?: string }>;
}) {
  // `searchParams` can be a Promise (Next 15+) or a plain object depending on
  // the runtime context. Handle both safely so a malformed value can't kill
  // the entire route.
  let sp: { q?: string; category?: string; city?: string; verified?: string } = {};
  try {
    sp = await searchParams;
  } catch {
    sp = {};
  }
  // Defensive: searchParams may be a plain object on older paths.
  if (!sp || typeof sp !== 'object') sp = {};
  let jsonLdString = '{}';
  try {
    jsonLdString = JSON.stringify(
      breadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Search', url: '/search' },
      ]),
    );
  } catch {
    // Ignore JSON-LD failures — they should never break the page.
  }

  return (
    <div className="container-wide py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />

      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {sp.q ? `Results for “${sp.q}”` : 'Browse businesses'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Filter by category, city, or only show verified businesses.
        </p>
      </header>

      <Suspense fallback={<SearchSkeleton />}>
        <SearchResultsBoundary>
          <SearchResults initial={sp} />
        </SearchResultsBoundary>
      </Suspense>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-40" />
      ))}
    </div>
  );
}
