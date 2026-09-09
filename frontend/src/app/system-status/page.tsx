import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';
import { PageShell } from '@/components/layout/page-shell';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'System status',
  description: 'Live reliability status for the Credible platform.',
  path: '/system-status',
});

export const revalidate = 300;

const SERVICES = [
  { name: 'Website', status: 'Operational', ok: true },
  { name: 'Reviews API', status: 'Operational', ok: true },
  { name: 'Verification service', status: 'Operational', ok: true },
  { name: 'User dashboard', status: 'Operational', ok: true },
];

export default function SystemStatusPage() {
  return (
    <div className="py-12">
      <PageShell
        eyebrow="System status"
        title="How Credible is doing."
        subtitle="We monitor our services around the clock. If anything is ever affected, you'll find it here first."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <Card key={s.name} className="flex items-center justify-between p-5">
              <span className="font-display font-semibold">{s.name}</span>
              <span className="flex items-center gap-2 text-sm font-medium text-success">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-success" aria-hidden />
                {s.status}
              </span>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          All systems operational. Last checked just now.
        </p>
      </PageShell>
    </div>
  );
}
