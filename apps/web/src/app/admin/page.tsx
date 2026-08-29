'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Banknote } from 'lucide-react';

// NOTE: "Review moderation" (/admin/reviews) and "User management" (/admin/users)
// shortcuts were removed — those pages don't exist yet, even though the API
// already supports flagged-review moderation (GET/POST /admin/reviews/...).
// Add them back once the corresponding frontend pages are built.
const SHORTCUTS: Array<{ href: Route; title: string; description: string; icon: typeof ShieldCheck }> = [
  {
    href: '/admin/verification',
    title: 'Verification queue',
    description: 'Review pending applications and approve/reject badges.',
    icon: ShieldCheck,
  },
  {
    href: '/admin/billing',
    title: 'Billing & subscriptions',
    description: 'Revenue, payments, subscriptions and vouchers.',
    icon: Banknote,
  },
];

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Admin overview</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back. Use the shortcuts below to get to your most common tasks.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {SHORTCUTS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="group">
              <Card className="transition-shadow group-hover:shadow-md">
                <CardHeader>
                  <Icon className="h-6 w-6 text-primary" />
                  <CardTitle className="mt-2">{s.title}</CardTitle>
                  <CardDescription>{s.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}