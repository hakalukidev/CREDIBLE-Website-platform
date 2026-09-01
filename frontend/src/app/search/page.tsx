import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchResults } from '@/features/business/search-results';
import { breadcrumbSchema } from '@/lib/seo/structured-data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata = {
  title: 'Search',
  description: 'Search businesses and professionals on Credible.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; city?: string; verified?: string }>;
}) {
  const sp = await searchParams;
  const jsonLd = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Search', url: '/search' },
  ]);

  return (
    <div className="container-wide py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
        <SearchResults initial={sp} />
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