import { Code } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'Embeddable Widgets · Credible',
  description:
    'Drop-in widgets to display your Credible reviews, trust score, verified badge, and leave-a-review button on any website.',
  path: '/widgets',
});

const widgets = [
  {
    id: 'review',
    title: 'Review widget',
    description:
      'Show your average rating and recent reviews directly on your business website.',
    snippet: (id: string) => `<div class="credible-review-widget"
     data-business-id="${id}"
     data-theme="light"
     data-max-reviews="5"></div>
<script async src="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://credible.com'}/widgets/review-widget.js"></script>`,
  },
  {
    id: 'trust',
    title: 'Trust score widget',
    description: 'Display a circular gauge of your Credible trust score.',
    snippet: (id: string) => `<div class="credible-trust-score"
     data-business-id="${id}"
     data-theme="light"
     data-show-details="true"></div>
<script async src="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://credible.com'}/widgets/trust-score.js"></script>`,
  },
  {
    id: 'badge',
    title: 'Verified badge',
    description: 'Show the official Credible Verified seal with a link to verification.',
    snippet: (id: string) => `<div class="credible-badge"
     data-business-id="${id}"></div>
<script async src="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://credible.com'}/widgets/badge.js"></script>`,
  },
  {
    id: 'leave-review',
    title: 'Leave a review button',
    description: 'A clean CTA that opens the review-submission flow in a new tab.',
    snippet: (id: string) => `<div class="credible-leave-review"
     data-business-id="${id}"
     data-text="Leave a review"
     data-color="blue"
     data-size="md"></div>
<script async src="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://credible.com'}/widgets/leave-review-button.js"></script>`,
  },
];

const DEMO_BUSINESS_ID = 'demo-business-id';

export default function WidgetsDemoPage() {
  return (
    <div className="container-wide py-10 space-y-8">
      <header className="space-y-2">
        <Badge variant="secondary">Widgets</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Embed Credible on your site</h1>
        <p className="text-muted-foreground max-w-2xl">
          Drop-in widgets that pull live review and verification data from the Credible public API. No
          build step required — paste the snippet and the widget renders on page load.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {widgets.map((w) => (
          <Card key={w.id}>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">{w.title}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{w.description}</p>
              <div className="mt-3 rounded-md border bg-muted/40 p-3">
                <pre className="overflow-x-auto text-xs leading-relaxed">
                  <code>{w.snippet(DEMO_BUSINESS_ID)}</code>
                </pre>
              </div>
              <p className="text-xs text-muted-foreground">
                Replace <code className="rounded bg-muted px-1">{`<your business id>`}</code> with the
                id from your dashboard. Widgets inherit theme from the <code>data-theme</code>{' '}
                attribute and accept further customisation per the API docs.
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Need an API key?</h2>
        <p className="text-sm text-muted-foreground">
          Higher-volume integrations should use the public REST API with an API key for stable
          rate limits. See <a className="text-primary underline" href="/api-docs">API docs</a>.
        </p>
      </section>
    </div>
  );
}