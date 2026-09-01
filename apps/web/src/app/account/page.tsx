// app/account/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Account root — currently a thin redirect to `/account/reviews` so that
 * hitting the bare `/account` URL never 404s. The header dropdown links
 * directly to `/account/reviews`, but any deep link or bookmark to the
 * account landing URL should still resolve gracefully.
 *
 * If a richer account overview (profile summary, settings shortcuts,
 * etc.) is built later, it can replace this file without changing any
 * other route in the app.
 */
export default function AccountIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/account/reviews');
  }, [router]);

  return (
    <div className="container-narrow py-24 flex flex-col items-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <p>Loading your account…</p>
    </div>
  );
}