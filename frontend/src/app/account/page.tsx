// app/account/page.tsx
'use client';

import { AccountShell } from '@/components/account/account-shell';

/**
 * Account landing — replaces the old redirect stub. Tabs default to
 * "reviews" so the page feels familiar to anyone who used to land on
 * `/account/reviews` directly.
 */
export default function AccountIndexPage() {
  return <AccountShell defaultTab="reviews" />;
}
