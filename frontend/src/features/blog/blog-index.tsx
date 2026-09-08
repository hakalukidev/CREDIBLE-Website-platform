'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageShell } from '@/components/layout/page-shell';
import { SkeletonStack } from '@/components/dashboard/primitives/skeleton-stack';
import { cn } from '@/lib/utils';
import { BlogPagination } from '@/components/static/blog-pagination';
import { CATEGORIES, type BlogPost } from '@/features/blog/posts';

const PAGE_SIZE = 6;

interface BlogIndexProps {
  posts: BlogPost[];
}

/**
 * Client-side blog index. Search, category filter, and pagination all
 * live in the URL (`?q=`, `?cat=`, `?page=`) so deep links survive
 * refresh and the filtered view is shareable.
 */
export function BlogIndex({ posts }: BlogIndexProps) {
  // Next 16 forces useSearchParams consumers into a Suspense boundary.
  return (
    <Suspense fallback={<BlogIndexFallback />}>
      <BlogIndexInner posts={posts} />
    </Suspense>
  );
}

function BlogIndexFallback() {
  return (
    <div className="py-12">
      <PageShell
        eyebrow="Blog"
        title="Insights & updates"
        subtitle="Practical guides, product updates, and thought leadership on building trust in Bangladesh's business ecosystem."
      >
        <SkeletonStack count={3} height="h-32" />
      </PageShell>
    </div>
  );
}

function BlogIndexInner({ posts }: BlogIndexProps) {
  const router = useRouter();
  const params = useSearchParams();

  const query = params.get('q') ?? '';
  const rawCat = params.get('cat') ?? '';
  const category = CATEGORIES.includes(rawCat as (typeof CATEGORIES)[number])
    ? rawCat
    : '';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (category && post.category !== category) return false;
      if (!needle) return true;
      return (
        post.title.toLowerCase().includes(needle) ||
        post.excerpt.toLowerCase().includes(needle)
      );
    });
  }, [posts, query, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const navigate = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === '') sp.delete(key);
      else sp.set(key, value);
    }
    // Changing filters should always return the user to page 1.
    if ('q' in next || 'cat' in next) sp.delete('page');
    const qs = sp.toString();
    router.push(qs ? `/blog?${qs}` : '/blog', { scroll: false });
  };

  return (
    <div className="py-12">
      <PageShell
        eyebrow="Blog"
        title="Insights & updates"
        subtitle="Practical guides, product updates, and thought leadership on building trust in Bangladesh's business ecosystem."
      >
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search posts…"
              defaultValue={query}
              onChange={(e) => navigate({ q: e.target.value || null })}
              className="h-10 rounded-full pl-9"
              aria-label="Search blog posts"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterPill
              label="All"
              active={!category}
              onClick={() => navigate({ cat: null })}
            />
            {CATEGORIES.map((cat) => (
              <FilterPill
                key={cat}
                label={cat}
                active={category === cat}
                onClick={() => navigate({ cat: cat })}
              />
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <Card className="p-10 text-center text-sm text-muted-foreground">
            No posts match these filters. Try clearing the search or picking a different category.
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => navigate({ q: null, cat: null })}
              >
                Clear filters
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}

        <BlogPagination
          page={safePage}
          totalPages={totalPages}
          onPageChange={(next) => navigate({ page: next === 1 ? null : String(next) })}
        />
      </PageShell>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'border border-border/70 bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Card className="flex flex-col overflow-hidden p-0 shadow-card transition-shadow hover:shadow-pop">
      <div
        className="mb-0 flex h-32 items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-5xl"
        aria-hidden
      >
        {post.coverEmoji}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary">{post.category}</Badge>
          <span className="text-xs text-muted-foreground">{post.readTime}</span>
        </div>
        <h2 className="font-semibold leading-snug">
          <Link href={`/blog/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground flex-1">{post.excerpt}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('en-BD', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </time>
          <span>{post.author.name}</span>
        </div>
      </div>
    </Card>
  );
}
