import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { JsonLd } from '@/components/static/json-ld';
import { TableOfContents } from '@/components/static/table-of-contents';
import { pageMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema, ORG_ID, SITE_NAME, SITE_URL } from '@/lib/seo/structured-data';
import {
  POSTS,
  getPostBySlug,
  getRelatedPosts,
  slugifyHeading,
  type BlogPostBlock,
} from '@/features/blog/posts';
import { ShareButtons } from '@/components/blog/share-buttons';

export const revalidate = 86_400;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post not found' };
  return pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const headings = post.body.filter(
    (b): b is Extract<BlogPostBlock, { type: 'heading' }> => b.type === 'heading' && b.level === 2,
  );
  const tocItems = headings.map((h) => ({
    id: slugifyHeading(h.text),
    label: h.text,
  }));
  const related = getRelatedPosts(post);
  const postUrl = `${SITE_URL}/blog/${post.slug}`;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Blog', url: '/blog' },
            { name: post.title, url: `/blog/${post.slug}` },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date,
            author: { '@type': 'Person', name: post.author.name },
            publisher: { '@id': ORG_ID, name: SITE_NAME },
          },
        ]}
      />

      <article className="container-wide py-12">
        <header className="mx-auto max-w-3xl text-center">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 py-1.5 pl-3 pr-4 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-border hover:text-foreground"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            Back to blog
          </Link>
          <Badge variant="secondary" className="mt-5">
            {post.category}
          </Badge>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-5xl md:leading-tight">
            {post.title}
          </h1>
          <p className="mt-4 text-muted-foreground">{post.excerpt}</p>
          <div className="mt-8 flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <Avatar className="h-9 w-9 ring-2 ring-ring/40">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {post.author.initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="font-medium text-foreground">{post.author.name}</p>
              <p className="text-xs">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>{' '}
                · {post.readTime}
              </p>
            </div>
          </div>
        </header>

        <div className="relative mx-auto mt-12 flex h-56 max-w-3xl items-center justify-center overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/15 via-primary/5 to-secondary/10 shadow-pop">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.08) 1px, transparent 0)',
              backgroundSize: '22px 22px',
            }}
          />
          <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-[28rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <span className="relative text-7xl" aria-hidden>
            {post.coverEmoji}
          </span>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[12rem_1fr]">
          <TableOfContents items={tocItems} />

          <div className="mx-auto max-w-3xl space-y-5 text-base leading-relaxed text-foreground">
            {post.body.map((block, idx) => (
              <RenderBlock key={idx} block={block} />
            ))}

            <ShareButtons url={postUrl} title={post.title} />
          </div>
        </div>

        {related.length > 0 && (
          <section className="mx-auto mt-16 max-w-5xl border-t border-border/60 pt-10">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Related posts
              </h2>
              <Link
                href={'/blog' as never}
                className="hidden items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80 sm:inline-flex"
              >
                All posts
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/blog/${r.slug}` as never}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop"
                  >
                    <div
                      className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-primary/10 via-brand-200/20 to-gold/20 text-5xl transition-transform duration-500 group-hover:scale-[1.03]"
                      aria-hidden
                    >
                      {r.coverEmoji}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                          {r.category}
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" aria-hidden />
                          {r.readTime}
                        </span>
                      </div>
                      <h3 className="font-display text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {r.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {r.excerpt}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="relative mx-auto mt-16 max-w-3xl overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-8 text-center sm:p-10">
          <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-80 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <h2 className="font-display text-xl font-semibold sm:text-2xl">
            Get monthly updates
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            One short email per month — new posts, product updates, and the occasional field
            report. No spam.
          </p>
          <form
            className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row sm:items-center sm:justify-center"
            action="/blog"
            method="get"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email
            </label>
            <input
              id="newsletter-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              className="h-11 w-full rounded-full border border-border/70 bg-background px-5 text-sm shadow-sm transition-shadow focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus-visible:border-primary/50 sm:w-72"
            />
            <Button type="submit" className="h-11 px-6 shrink-0">
              Subscribe
            </Button>
          </form>
        </section>
      </article>
    </>
  );
}

function RenderBlock({ block }: { block: BlogPostBlock }) {
  switch (block.type) {
    case 'heading':
      if (block.level === 2) {
        return (
          <h2
            id={slugifyHeading(block.text)}
            className="mt-8 font-display text-2xl font-bold tracking-tight"
          >
            {block.text}
          </h2>
        );
      }
      return (
        <h3
          id={slugifyHeading(block.text)}
          className="mt-6 text-lg font-semibold"
        >
          {block.text}
        </h3>
      );
    case 'paragraph':
      return <p>{block.text}</p>;
    case 'list':
      if (block.ordered) {
        return (
          <ol className="list-decimal space-y-1 pl-6">
            {block.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="list-disc space-y-1 pl-6">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case 'quote':
      return (
        <blockquote className="rounded-r-2xl border-l-4 border-primary bg-primary/5 py-4 pl-5 pr-4 italic text-muted-foreground">
        {block.text}
        {block.cite && (
          <footer className="mt-1 text-xs not-italic">— {block.cite}</footer>
        )}
      </blockquote>
      );
    case 'code':
      return (
        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
          <code>{block.text}</code>
        </pre>
      );
  }
}
