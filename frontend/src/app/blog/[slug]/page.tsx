import { notFound } from 'next/navigation';
import Link from 'next/link';
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
          <Link href="/blog" className="text-xs text-muted-foreground hover:underline">
            ← Back to blog
          </Link>
          <Badge variant="secondary" className="mt-4">
            {post.category}
          </Badge>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">{post.title}</h1>
          <p className="mt-3 text-muted-foreground">{post.excerpt}</p>
          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {post.author.initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="font-medium text-foreground">{post.author.name}</p>
              <p className="text-xs">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-BD', {
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

        <div
          className="mx-auto mt-10 flex h-48 max-w-3xl items-center justify-center rounded-2xl border border-border/70 bg-gradient-to-br from-primary/10 to-primary/5 text-7xl shadow-card"
          aria-hidden
        >
          {post.coverEmoji}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[12rem_1fr]">
          <TableOfContents items={tocItems} />

          <div className="mx-auto max-w-3xl space-y-5 text-base leading-relaxed text-foreground">
            {post.body.map((block, idx) => (
              <RenderBlock key={idx} block={block} />
            ))}

            <div className="mt-10 rounded-2xl border border-border/70 bg-muted/30 p-6 shadow-card">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Share
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ShareLink
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(postUrl)}`}
                  label="Twitter"
                />
                <ShareLink
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`}
                  label="Facebook"
                />
                <ShareLink
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
                  label="LinkedIn"
                />
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mx-auto mt-16 max-w-3xl border-t pt-8">
            <h2 className="text-lg font-semibold">Related posts</h2>
            <ul className="mt-4 space-y-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/blog/${r.slug}`}
                    className="group block rounded-md border p-4 hover:border-primary/40 hover:bg-accent/40"
                  >
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {r.category} · {r.readTime}
                    </p>
                    <p className="mt-1 font-medium group-hover:underline">{r.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{r.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mx-auto mt-16 max-w-3xl rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
          <h2 className="text-lg font-semibold">Get monthly updates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            One short email per month — new posts, product updates, and the occasional field
            report. No spam.
          </p>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center"
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
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-72"
            />
            <Button type="submit">Subscribe</Button>
          </form>
        </section>
      </article>
    </>
  );
}

function ShareLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
    >
      {label}
    </a>
  );
}

function RenderBlock({ block }: { block: BlogPostBlock }) {
  switch (block.type) {
    case 'heading':
      if (block.level === 2) {
        return (
          <h2
            id={slugifyHeading(block.text)}
            className="mt-8 text-2xl font-bold tracking-tight"
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
        <blockquote className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground">
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
