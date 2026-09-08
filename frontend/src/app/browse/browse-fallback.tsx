'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Client-side error boundary for the BrowseResults chunk. If the chunk
 * throws (e.g. a stale Turbopack bundle references a removed export),
 * renders a friendly fallback rather than letting the error bubble to
 * the global app boundary.
 */
export class BrowseResultsBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[browse-fallback] BrowseResults crashed:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-dashed bg-muted/40 p-8 text-center">
          <p className="text-sm font-medium text-destructive">
            Browse results couldn&apos;t load
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">
            We&apos;re having trouble loading the directory right now.
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Please try again in a moment, or head back home.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={() => this.setState({ hasError: false })}>Try again</Button>
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
