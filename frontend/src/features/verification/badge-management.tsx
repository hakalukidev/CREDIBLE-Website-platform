'use client';

import { useState } from 'react';
import { Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  VERIFICATION_LEVEL_LABELS,
} from '@credible/shared';
import { useBadge, useBadgeEmbed } from './verification-hooks';

interface Props {
  businessId: string;
}

export function BadgeManagement({ businessId }: Props) {
  const { data: badge, isLoading } = useBadge(businessId);
  const { data: embed } = useBadgeEmbed(businessId);
  const [activeTab, setActiveTab] = useState('embed');

  if (isLoading) return <Skeleton className="h-48" />;
  if (!badge?.hasBadge) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your badge</CardTitle>
          <CardDescription>
            Once your application is approved, your badge will appear here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied to clipboard`);
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle>
              {VERIFICATION_LEVEL_LABELS[badge.badgeType ?? 'NONE']} badge
            </CardTitle>
          </div>
          {badge.verificationUrl && (
            <Button asChild variant="ghost" size="sm">
              <a href={badge.verificationUrl} target="_blank" rel="noreferrer">
                View public page <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
        <CardDescription>
          Issued {badge.issuedAt ? new Date(badge.issuedAt).toLocaleDateString() : 'recently'}
          {badge.expiresAt
            ? ` · expires ${new Date(badge.expiresAt).toLocaleDateString()}`
            : ' · never expires'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="embed">Embed on your website</TabsTrigger>
            <TabsTrigger value="image">Direct image URL</TabsTrigger>
          </TabsList>

          <TabsContent value="embed" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Drop this snippet into any HTML page to display your live badge. It updates
              automatically if your status changes.
            </p>
            {embed && (
              <>
                <CodeBlock
                  title="HTML (paste where you want the badge)"
                  value={embed.html}
                  onCopy={() => copy(embed.html, 'HTML')}
                />
                <CodeBlock
                  title="JavaScript (loader — paste before </body>)"
                  value={embed.javascript}
                  onCopy={() => copy(embed.javascript, 'Loader')}
                />
                <CodeBlock
                  title="Optional CSS"
                  value={embed.css}
                  onCopy={() => copy(embed.css, 'CSS')}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="image" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Use this URL to embed the badge as a plain <code>&lt;img&gt;</code> tag.
            </p>
            <CodeBlock
              title="Image URL"
              value={badge.badgeImageUrl ?? '(image not ready yet)'}
              onCopy={() => copy(badge.badgeImageUrl ?? '', 'Image URL')}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function CodeBlock({
  title,
  value,
  onCopy,
}: {
  title: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/40">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <Button type="button" size="sm" variant="ghost" onClick={onCopy}>
          <Copy className="h-3 w-3" /> Copy
        </Button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs">
        <code>{value}</code>
      </pre>
    </div>
  );
}
