'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Top-level error boundary for runtime errors inside the App Router.
 * Next.js will surface this for any uncaught error thrown during render.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('App error', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }, [error]);

  return (
    <div className="container-narrow py-24 text-center">
      <p className="text-sm font-medium text-destructive">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">We hit an unexpected snag</h1>
      <p className="mt-2 text-muted-foreground">
        The team has been notified. You can try again, or head back home.
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-muted-foreground">
          Reference: <code>{error.digest}</code>
        </p>
      )}
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}