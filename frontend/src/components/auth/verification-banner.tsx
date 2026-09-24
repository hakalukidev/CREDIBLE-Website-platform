'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { MailCheck, RefreshCcw, ShieldAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/store/session';
import { useUI } from '@/lib/store/theme';
import { apiClient } from '@/lib/api/client';
import { friendlyMessage } from '@/components/ui/friendly-error';

const DISMISS_KEY = 'credible-verify-banner-dismissed';

/**
 * Sticky banner shown above the page chrome for signed-in users whose
 * email isn't verified yet. Two CTAs:
 *   - "Verify now" opens the auth modal in `verify` mode.
 *   - "Resend code" requests a fresh OTP and toasts on success.
 *
 * Dismissible per browser (localStorage flag); the flag is cleared
 * automatically when the session emailVerified flips back to false
 * (e.g. a new signup on a different browser wouldn't trigger this,
 * but if the server ever un-verifies an account the banner returns).
 */
export function VerificationBanner() {
  const session = useSession((s) => s.session);
  const openAuth = useUI((s) => s.openAuth);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  });

  const visible = Boolean(session && session.user.emailVerified === false) && !dismissed;

  function dismiss() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISS_KEY, '1');
    }
    setDismissed(true);
  }

  const resend = useMutation({
    mutationFn: async () => {
      if (!session?.user.email) throw new Error('Missing email');
      await apiClient.post('/auth/otp/request', {
        email: session.user.email,
        purpose: 'email_verify',
      });
    },
    onSuccess: () => {
      toast.success(`New code sent to ${session?.user.email}`);
    },
    onError: () => {
      toast.error(friendlyMessage(undefined, 'verify-email'));
    },
  });

  function openVerifyModal() {
    if (!session?.user.email) return;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(DISMISS_KEY);
    }
    setDismissed(false);
    openAuth('verify');
  }

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          role="status"
          aria-live="polite"
          className="z-40 border-b border-amber-200 bg-amber-50 text-amber-900"
        >
          <div className="container-wide flex flex-col items-start gap-2 py-2.5 text-sm sm:flex-row sm:items-center sm:gap-3 sm:py-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              <p className="font-medium">
                Verify your email to unlock reviews, claims, and the verified badge.
              </p>
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => resend.mutate()}
                disabled={resend.isPending}
                className="h-7 px-2.5 text-amber-900 hover:bg-amber-100/80"
              >
                <RefreshCcw className="mr-1 h-3.5 w-3.5" aria-hidden />
                {resend.isPending ? 'Sending…' : 'Resend code'}
              </Button>
              <Button
                size="sm"
                onClick={openVerifyModal}
                className="h-7 bg-amber-900 px-3 text-amber-50 hover:bg-amber-800"
              >
                <MailCheck className="mr-1 h-3.5 w-3.5" aria-hidden />
                Verify now
              </Button>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss verification banner"
                className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-amber-900/70 transition-colors hover:bg-amber-100/80 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700/40"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
