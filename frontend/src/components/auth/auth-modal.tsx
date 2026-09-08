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
import { BrandMark } from './brand-mark';
import { useSession } from '@/lib/store/session';
import { homeForRole } from '@/lib/auth/redirects';

type Mode = 'signin' | 'signup';

interface AuthModalProps {
  open: boolean;
  initialMode?: Mode;
  onOpenChange: (open: boolean) => void;
}

/**
 * Two-column authentication modal built on Radix `Dialog`. The left
 * brand panel is decorative (hidden below `lg`); the right column holds
 * the form and scrolls independently so the dialog never clips on short
 * viewports. Toggling sign-in/sign-up state lives in `AuthRightPanel` —
 * re-mounting it via `key={initialMode}` resets that state per open.
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
        className="w-[min(96vw,1280px)] max-h-[calc(100dvh-2rem)] flex flex-col gap-0 overflow-hidden rounded-2xl border border-border/70 bg-background p-0 shadow-2xl"
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

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <AuthLeftPanel />

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {/* Compact brand row for the single-column (mobile) layout */}
            <div className="px-6 pb-6 pt-6 sm:px-10 lg:hidden">
              <BrandMark brand="Credible" />
            </div>
            <AuthRightPanel key={initialMode} initialMode={initialMode} />
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