import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageShell } from '@/components/layout/page-shell';
import { BrowseResults, type BrowseFilters } from '@/features/business/browse-results';
import { BrowseResultsBoundary } from './browse-fallback';
import { breadcrumbSchema } from '@/lib/seo/structured-data';
import { JsonLd } from '@/components/static/json-ld';
import { pageMetadata } from '@/lib/seo/metadata';

// Filter-driven dynamic route — never prerender.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = pageMetadata({
  title: 'Browse businesses',
  description:
    'Browse trusted businesses on Credible. Filter by category, minimum rating, sort order, and verification status.',
  path: '/browse',
});

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<BrowseFilters>;
}) {
  let sp: BrowseFilters = {};
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
      { name: 'Browse', url: '/browse' },
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
        subtitle="Filter by category, minimum rating, sort order, and verification status."
      >
        <Suspense fallback={<BrowseSkeleton />}>
          <BrowseResultsBoundary>
            <BrowseResults initial={sp} />
          </BrowseResultsBoundary>
        </Suspense>
      </PageShell>
    </>
  );
}

function BrowseSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/70 bg-card p-5">
        <Skeleton className="h-11 w-full rounded-md" />
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="ml-auto h-9 w-64 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-[360px] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
