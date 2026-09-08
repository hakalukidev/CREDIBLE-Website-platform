'use client';

import { useEffect } from 'react';
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
import { AuthRightPanel } from './auth-right-panel';
import { useSession } from '@/lib/store/session';
import { homeForRole } from '@/lib/auth/redirects';

type Mode = 'signin' | 'signup';

interface AuthModalProps {
  open: boolean;
  initialMode?: Mode;
  onOpenChange: (open: boolean) => void;
}

/**
 * Two-column authentication modal. Built on Radix `Dialog` so focus
 * management, scroll locking, Escape-to-close, and ARIA wiring are
 * inherited. The form state (signin/signup toggle) lives in the
 * `AuthRightPanel` — re-mounting the panel via `key={initialMode}`
 * resets that internal state every time the modal opens.
 */
export function AuthModal({ open, initialMode = 'signin', onOpenChange }: AuthModalProps) {
  const router = useRouter();
  const session = useSession((s) => s.session);

  // If the user is already signed in when the modal opens, send them to
  // the role-appropriate landing page instead of forcing them through
  // the auth form.
  useEffect(() => {
    if (!open || !session) return;
    router.replace(homeForRole(session.user.role) as never);
  }, [open, session, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[min(96vw,960px)] gap-0 overflow-hidden rounded-2xl border border-border/70 bg-background p-0 shadow-2xl"
        hideDefaultClose
        onOpenAutoFocus={(e) => {
          // Skip Radix's default first-focusable target so focus lands
          // on the first form input instead of the close button.
          e.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">
          {initialMode === 'signin' ? 'Sign in to Credible' : 'Create your Credible account'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {initialMode === 'signin'
            ? 'Enter your email and password to sign in.'
            : 'Create a new account to join Credible.'}
        </DialogDescription>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <AuthLeftPanel />
          <AuthRightPanel key={initialMode} initialMode={initialMode} />
        </div>

        <DialogClose
          aria-label="Close authentication dialog"
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <X className="h-[18px] w-[18px]" aria-hidden />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
