import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata = pageMetadata({
  title: 'API Documentation · Credible',
  description:
    'Public REST API for accessing business profiles, reviews, trust scores, and verification badges.',
  path: '/api-docs',
});

const endpoints = [
  {
    method: 'GET',
    path: '/public/business/{slugOrId}',
    description: 'Get a business profile by slug or id.',
  },
  {
    method: 'GET',
    path: '/public/business/{slugOrId}/reviews',
    description: 'List published reviews for a business (paginated).',
  },
  {
    method: 'GET',
    path: '/public/business/{slugOrId}/trust-score',
    description: 'Compute the 0–100 trust score.',
  },
  {
    method: 'GET',
    path: '/public/business/{slugOrId}/badge',
    description: 'Get the verification badge metadata.',
  },
  {
    method: 'GET',
    path: '/public/business/{slugOrId}/widget',
    description: 'Combined payload for the embed widget (profile + reviews + trust).',
  },
  {
    method: 'POST',
    path: '/public/business/{slugOrId}/widget/event',
    description: 'Track a widget impression (requires `widget.read` scope).',
  },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export default function ApiDocsPage() {
  return (
    <div className="container-wide py-10 space-y-8">
      <header className="space-y-3">
        <Badge variant="secondary">API v1</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Credible Public API</h1>
        <p className="text-muted-foreground max-w-2xl">
          Read-only REST endpoints for accessing business profiles, reviews, trust scores, and
          verification badges. All endpoints return a JSON envelope of the shape{' '}
          <code className="rounded bg-muted px-1">{`{ success, data, meta? }`}</code>.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Authentication</h2>
        <Card>
          <CardContent className="pt-6 space-y-2 text-sm">
            <p>
              Pass your API key in the <code className="rounded bg-muted px-1">X-API-Key</code>{' '}
              header. API keys are issued from the business dashboard and have a default budget of{' '}
              <strong>60 requests / minute</strong>.
            </p>
            <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs">
{`curl -H "X-API-Key: ck_xxxxxxxxxxxxxxxx" \\
  ${API_BASE}/public/business/demo-slug`}
            </pre>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Endpoints</h2>
        <div className="space-y-2">
          {endpoints.map((e) => (
            <Card key={`${e.method}-${e.path}`}>
              <CardContent className="pt-4 pb-4 flex items-start gap-4">
                <span
                  className={`shrink-0 rounded px-2 py-1 text-xs font-bold ${
                    e.method === 'GET'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {e.method}
                </span>
                <div className="flex-1 min-w-0">
                  <code className="text-sm font-mono break-all">{e.path}</code>
                  <p className="text-sm text-muted-foreground mt-1">{e.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">OpenAPI specification</h2>
        <Card>
          <CardContent className="pt-6 space-y-3 text-sm">
            <p>
              The full machine-readable spec is served at{' '}
              <code className="rounded bg-muted px-1">/api/v1/openapi.yaml</code>. Drop it into
              Stoplight, Redocly, or Swagger UI for an interactive explorer.
            </p>
            <Button asChild variant="outline" size="sm">
              <a href={`${API_BASE.replace(/\/$/, '')}/openapi.yaml`} target="_blank" rel="noreferrer">
                Download openapi.yaml
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}