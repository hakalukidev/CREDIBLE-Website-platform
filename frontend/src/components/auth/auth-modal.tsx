'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { AuthLeftPanel } from './auth-left-panel';
import { AuthRightPanel, type AuthMode } from './auth-right-panel';
import { BrandMark } from './brand-mark';
import { useSession } from '@/lib/store/session';
import { useUI } from '@/lib/store/theme';
import { homeForRole } from '@/lib/auth/redirects';
import type { AuthSession } from '@credible/types';

export type { AuthMode };

interface AuthModalProps {
  open: boolean;
  initialMode?: AuthMode;
  onOpenChange: (open: boolean) => void;
}

/**
 * Two-column authentication modal built on Radix `Dialog`. The left
 * brand panel is decorative (hidden below `lg`); the right column holds
 * the form and scrolls independently so the dialog never clips on short
 * viewports.
 *
 * Mode transitions (signin ↔ signup ↔ verify) live here so the
 * `RegisterForm` can promote the panel into the verify screen on a
 * successful signup without prop-drilling.
 */
export function AuthModal({ open, initialMode = 'signin', onOpenChange }: AuthModalProps) {
  const router = useRouter();
  const session = useSession((s) => s.session);
  const setAuthModeInStore = useUI((s) => s.setAuthMode);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  // Email + name captured at signup so the verify panel can render
  // without a separate API round-trip.
  const [verifyEmail, setVerifyEmail] = useState<string>('');
  const [verifyFirstName, setVerifyFirstName] = useState<string | undefined>(undefined);

  // Reset state every time the modal closes so the next open feels
  // fresh. When opening into `verify` mode, seed the email/name from
  // the active session so the panel has what it needs without a round
  // trip through the API.
  useEffect(() => {
    if (!open) {
      setMode(initialMode);
      setVerifyEmail('');
      setVerifyFirstName(undefined);
      return;
    }
    if (initialMode === 'verify' && session?.user.email && !verifyEmail) {
      setVerifyEmail(session.user.email);
      setVerifyFirstName(session.user.firstName);
      setMode('verify');
    }
  }, [open, initialMode, session, verifyEmail]);

  // If the user is already signed in when the modal opens, send them to
  // the role-appropriate landing page instead of forcing them through
  // the auth form. Exception: they were in the middle of verifying.
  useEffect(() => {
    if (!open || !session) return;
    if (mode === 'verify' && !session.user.emailVerified) return;
    router.replace(homeForRole(session.user.role) as never);
  }, [open, session, router, mode]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Closing — reset the mode in the store so the modal re-opens
      // fresh next time (avoids an empty verify-state footgun).
      setAuthModeInStore('signin');
      if (session?.user.emailVerified) {
        router.replace(homeForRole(session.user.role) as never);
      }
    }
    onOpenChange(next);
  }

  function handleVerified() {
    setAuthModeInStore('signin');
    onOpenChange(false);
    if (session) router.replace(homeForRole(session.user.role) as never);
  }

  function handleVerifySkip() {
    setAuthModeInStore('signin');
    onOpenChange(false);
    if (session) router.replace(homeForRole(session.user.role) as never);
  }

  function handleSignupSuccess(s: AuthSession) {
    // RegisterForm already wrote the session via setSession. The modal
    // decides whether to flip into verify mode or close.
    if (s.user.emailVerified) {
      setAuthModeInStore('signin');
      onOpenChange(false);
      router.replace(homeForRole(s.user.role) as never);
      return;
    }
    setVerifyEmail(s.user.email);
    setVerifyFirstName(s.user.firstName);
    setMode('verify');
    // Mirror into the store so the root-level auto-dismiss keeps the
    // modal open while the user is verifying.
    setAuthModeInStore('verify');
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[min(96vw,800px)] max-w-none max-h-[calc(100dvh-2rem)] flex flex-col gap-0 overflow-hidden rounded-2xl border border-border/70 bg-background p-0 shadow-2xl"
        hideDefaultClose
        onOpenAutoFocus={(e) => {
          // Skip Radix's default first-focusable target so focus lands
          // on the first form input instead of the close button.
          e.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">
          {mode === 'signin'
            ? 'Sign in to Credible'
            : mode === 'signup'
              ? 'Create your Credible account'
              : 'Verify your email'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {mode === 'signin'
            ? 'Enter your email and password to sign in.'
            : mode === 'signup'
              ? 'Create a new account to join Credible.'
              : `Enter the 6-digit code we sent to ${verifyEmail || 'your email'}.`}
        </DialogDescription>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <AuthLeftPanel />

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {/* Compact brand row for the single-column (mobile) layout */}
            <div className="px-6 pb-6 pt-6 sm:px-10 lg:hidden">
              <BrandMark brand="Credible" />
            </div>
            <AuthRightPanel
              mode={mode}
              verifyEmail={verifyEmail}
              verifyFirstName={verifyFirstName}
              onModeChange={(m) => setMode(m)}
              onVerified={handleVerified}
              onVerifySkip={handleVerifySkip}
              onSignupSuccess={handleSignupSuccess}
            />
          </div>
        </div>

        <DialogClose
          aria-label="Close authentication dialog"
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-muted-foreground ring-1 ring-border backdrop-blur transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-[18px] w-[18px]" aria-hidden />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
