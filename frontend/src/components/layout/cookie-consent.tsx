'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const STORAGE_KEY = 'credible-cookie-consent';
// Bump this version whenever the privacy policy materially changes so
// returning users are re-prompted.
const POLICY_VERSION = '2026-09';
const ENABLED = process.env.NEXT_PUBLIC_COOKIE_BANNER_ENABLED !== 'false';

type ConsentStatus = 'accepted' | 'dismissed';

/**
 * Bottom-fixed cookie consent card. State is persisted in localStorage
 * under a single key. When the stored `version` differs from
 * `POLICY_VERSION` the banner re-appears even for users who previously
 * accepted.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ENABLED) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { version?: string };
        if (parsed.version === POLICY_VERSION) return;
      }
    } catch {
      // localStorage can throw in private mode — fall through to show banner.
    }
    setVisible(true);
  }, []);

  function persist(status: ConsentStatus) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ status, version: POLICY_VERSION, at: new Date().toISOString() }),
      );
    } catch {
      // Ignore — the user simply won't see the banner again this session.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-xl border bg-card p-4 shadow-lg sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="flex-1 text-sm text-foreground">
          We use essential cookies to keep you signed in and remember your preferences. By
          continuing, you agree to our{' '}
          <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => persist('dismissed')}
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Decline
          </Button>
          <Button
            size="sm"
            className="h-8"
            onClick={() => persist('accepted')}
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
