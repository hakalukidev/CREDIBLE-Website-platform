import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'Blog',
  description:
    'Insights, guides, and updates from the Credible team on trust, verification, and reviews.',
  path: '/blog',
});

const POSTS = [
  {
    slug: 'why-trust-matters',
    title: 'Why trust matters more than ever in Bangladesh',
    excerpt:
      'In a digital-first economy, consumers rely on online reviews before making purchasing decisions. Here\'s why building public trust is critical for every business.',
    category: 'Trust',
    date: '2026-08-15',
    readTime: '5 min',
  },
  {
    slug: 'how-verification-works',
    title: 'How the Credible verification process works',
    excerpt:
      'A step-by-step look at how our human-reviewed verification process works — from document submission to badge issuance.',
    category: 'Product',
    date: '2026-08-10',
    readTime: '4 min',
  },
  {
    slug: 'collecting-better-reviews',
    title: '7 tips for collecting more authentic reviews',
    excerpt:
      'Authentic reviews are the foundation of trust. Learn practical strategies to encourage genuine feedback from your customers.',
    category: 'Guide',
    date: '2026-08-05',
    readTime: '6 min',
  },
  {
    slug: 'trust-score-explained',
    title: 'Understanding your business trust score',
    excerpt:
      'Your trust score is computed from multiple signals — reviews, verification status, response rate, and more. Here\'s how each factor contributes.',
    category: 'Product',
    date: '2026-07-28',
    readTime: '5 min',
  },
  {
    slug: 'responding-to-negative-reviews',
    title: 'How to respond to negative reviews professionally',
    excerpt:
      'A negative review isn\'t the end — it\'s an opportunity. Learn the do\'s and don\'ts of responding to critical feedback.',
    category: 'Guide',
    date: '2026-07-20',
    readTime: '4 min',
  },
  {
    slug: 'platform-updates-august-2026',
    title: 'Platform updates: August 2026',
    excerpt:
      'New features, improvements, and fixes shipped this month — including widget analytics, improved search, and mobile optimisations.',
    category: 'Updates',
    date: '2026-07-15',
    readTime: '3 min',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Trust: 'bg-blue-100 text-blue-800',
  Product: 'bg-emerald-100 text-emerald-800',
  Guide: 'bg-amber-100 text-amber-800',
  Updates: 'bg-purple-100 text-purple-800',
};

export default function BlogPage() {
  return (
    <>
      <section className="border-b bg-gradient-to-b from-background to-muted/40">
        <div className="container-wide py-16">
          <Badge variant="secondary" className="mb-3">
            Blog
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Insights & updates
          </h1>
          <p className="mt-3 max-w-prose text-muted-foreground">
            Practical guides, product updates, and thought leadership on building trust in
            Bangladesh&apos;s business ecosystem.
          </p>
        </div>
      </section>

      <section className="container-wide py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((post) => (
            <Card key={post.slug} className="flex flex-col">
              <CardContent className="pt-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[post.category] ?? 'bg-gray-100 text-gray-800'}`}
                  >
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{post.readTime}</span>
                </div>
                <h2 className="font-semibold leading-snug">{post.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground flex-1">{post.excerpt}</p>
                <div className="mt-4">
                  {/* No individual post pages exist yet, so this only shows the date. */}
                  <time className="text-xs text-muted-foreground">
                    {new Date(post.date).toLocaleDateString('en-BD', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
