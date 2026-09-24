'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { Search, ArrowRight, Filter, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SkeletonStack } from '@/components/ui/skeleton-stack';
import { cn } from '@/lib/utils';
import { BlogPagination } from '@/components/static/blog-pagination';
import { CATEGORIES, type BlogPost } from '@/features/blog/posts';

const PAGE_SIZE = 6;

interface BlogIndexProps {
  posts: BlogPost[];
}

/**
 * Editorial blog index — featured post on top, then a 2-column grid with
 * filter chips. Inspired by actorawards.org media/news pages: clean,
 * editorial, light. Filters + search live in the URL so deep links survive.
 */
export function BlogIndex({ posts }: BlogIndexProps) {
  return (
    <Suspense fallback={<BlogIndexFallback />}>
      <BlogIndexInner posts={posts} />
    </Suspense>
  );
}

function BlogIndexFallback() {
  return (
    <div className="py-12">
      <div className="container-wide">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Blog
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Insights & updates
          </h1>
        </div>
        <SkeletonStack count={3} height="h-32" />
      </div>
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

  // Sort posts newest-first for editorial presentation.
  const sorted = useMemo(
    () => [...posts].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [posts],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sorted.filter((post) => {
      if (category && post.category !== category) return false;
      if (!needle) return true;
      return (
        post.title.toLowerCase().includes(needle) ||
        post.excerpt.toLowerCase().includes(needle)
      );
    });
  }, [sorted, query, category]);

  // Featured: first post in the filtered list (or first overall if no filters).
  const featured = filtered[0] ?? sorted[0];
  const rest = filtered.filter((p) => p.slug !== featured?.slug);

  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = rest.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const navigate = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === '') sp.delete(key);
      else sp.set(key, value);
    }
    if ('q' in next || 'cat' in next) sp.delete('page');
    const qs = sp.toString();
    router.push(qs ? `/blog?${qs}` : '/blog', { scroll: false });
  };

  return (
    <div className="bg-background">
      {/* Hero / page header */}
      <section className="border-b border-border/60 bg-light-hero">
        <div className="container-wide py-12 text-center md:py-16">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Blog
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Insights & updates.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Practical guides, product updates, and thought leadership on building trust.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border/60">
        <div className="container-wide py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" aria-hidden />
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
        </div>
      </section>

      {/* Featured post */}
      {featured && (query === '' && category === '') && (
        <section className="container-wide py-10 md:py-14">
          <FeaturedCard post={featured} />
        </section>
      )}

      {/* Grid */}
      <section className="container-wide pb-12 md:pb-20">
        {visible.length === 0 && !featured && (
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
        )}

        {visible.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}

        {visible.length > 0 && (
          <div className="mt-10">
            <BlogPagination
              page={safePage}
              totalPages={totalPages}
              onPageChange={(next) => navigate({ page: next === 1 ? null : String(next) })}
            />
          </div>
        )}
      </section>
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
        'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
        active
          ? 'bg-foreground text-background shadow-sm'
          : 'border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}

function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}` as never}
      className="group grid gap-6 overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop md:grid-cols-[1.1fr_1fr]"
    >
      <div
        className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-primary/15 via-brand-200/30 to-gold/30 text-7xl transition-transform duration-500 group-hover:scale-[1.02] md:aspect-auto md:min-h-[280px]"
        aria-hidden
      >
        {post.coverEmoji}
        <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
          Featured
        </span>
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-8">
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
            {post.category}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden />
            {post.readTime}
          </span>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {post.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {post.excerpt}
        </p>
        <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <span>
            {post.author.name} ·{' '}
            <time dateTime={post.date}>
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </time>
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary transition-transform group-hover:translate-x-1">
            Read article
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}` as never}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop"
    >
      <div
        className="relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-primary/10 via-brand-200/20 to-gold/20 text-5xl transition-transform duration-500 group-hover:scale-[1.03]"
        aria-hidden
      >
        {post.coverEmoji}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
            {post.category}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden />
            {post.readTime}
          </span>
        </div>
        <h3 className="font-display text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </time>
          <span>{post.author.name}</span>
        </div>
      </div>
    </Link>
  );
}
