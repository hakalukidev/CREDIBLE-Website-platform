import Link from 'next/link';
import { Code, Star, ShieldCheck, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'Embeddable Widgets',
  description:
    'Embed trust signals from Credible directly on your website — review widgets, trust scores, and verification badges.',
  path: '/widgets',
});

const WIDGETS = [
  {
    icon: MessageSquare,
    name: 'Review Widget',
    description:
      'Display your latest verified reviews and aggregate rating directly on your website.',
    embed: `<div id="credible-review-widget"></div>
<script>
  window.CredibleWidgetConfig = {
    businessId: 'YOUR_BUSINESS_ID',
    theme: 'light',
    maxReviews: 5
  };
</script>
<script src="https://credible.com/widgets/review-widget.js" async></script>`,
  },
  {
    icon: Star,
    name: 'Trust Score Widget',
    description:
      'Show your computed trust score with a visual progress bar and key metrics.',
    embed: `<div id="credible-trust-widget"></div>
<script>
  window.CredibleWidgetConfig = {
    businessId: 'YOUR_BUSINESS_ID',
    size: 'md',
    showDetails: true
  };
</script>
<script src="https://credible.com/widgets/trust-widget.js" async></script>`,
  },
  {
    icon: ShieldCheck,
    name: 'Badge Widget',
    description:
      'Display your Credible Verified or Certified badge with a link to the public verification page.',
    embed: `<div id="credible-badge-widget"></div>
<script>
  window.CredibleWidgetConfig = {
    businessId: 'YOUR_BUSINESS_ID',
    size: 'lg'
  };
</script>
<script src="https://credible.com/widgets/badge-widget.js" async></script>`,
  },
  {
    icon: Code,
    name: 'Leave a Review Button',
    description:
      'A clickable button that opens the review submission page for your business in a new tab.',
    embed: `<a href="https://credible.com/submit-review/YOUR_BUSINESS_ID"
   target="_blank"
   rel="noopener noreferrer"
   class="credible-review-btn">
   Leave a Review on Credible
</a>`,
  },
];

export default function WidgetsPage() {
  return (
    <>
      <section className="border-b bg-gradient-to-b from-background to-muted/40">
        <div className="container-wide py-16">
          <Badge variant="secondary" className="mb-3">
            Widgets
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Embeddable widgets
          </h1>
          <p className="mt-3 max-w-prose text-muted-foreground">
            Bring Credible&apos;s trust signals to your own website. Copy the embed code and paste it
            into your HTML — no API key required.
          </p>
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link href="/for-business">View all features</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-wide py-12 space-y-8">
        {WIDGETS.map(({ icon: Icon, name, description, embed }) => (
          <Card key={name}>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-4">
                <Icon className="h-7 w-7 text-primary shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold">{name}</h2>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Embed code:</p>
                <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs">
                  {embed}
                </pre>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
