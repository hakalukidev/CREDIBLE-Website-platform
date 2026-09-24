'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, MailCheck, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OtpInput } from '@/features/review/otp-input';
import { apiClient } from '@/lib/api/client';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { useSession } from '@/lib/store/session';

interface VerifyEmailPanelProps {
  /** Address a fresh code was just sent to. */
  email: string;
  /** Optional first name used in the headline. */
  firstName?: string;
  /** Called once the OTP is accepted and the session is marked verified. */
  onVerified?: () => void;
  /** Called when the user clicks "Skip for now" — the parent should
   *  close the modal but keep the user signed in. */
  onSkip?: () => void;
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Post-registration verification screen shown inside `AuthModal`. The
 * user lands here automatically after a successful signup so we can
 * confirm the email is theirs before continuing. A code is requested
 * during registration (`backend/src/modules/auth/auth.service.ts`),
 * so on mount we just wait for the user to type it in.
 */
export function VerifyEmailPanel({ email, firstName, onVerified, onSkip }: VerifyEmailPanelProps) {
  const setSession = useSession((s) => s.setSession);
  const session = useSession((s) => s.session);
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  // Tick down the resend cooldown once per second.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = window.setInterval(() => {
      setResendCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [resendCooldown]);

  const isCodeComplete = code.length === OTP_LENGTH;

  const verify = useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/otp/verify', {
        email,
        code,
        purpose: 'email_verify',
      });
    },
    onSuccess: () => {
      // Mirror the new flag into the persisted session so the dashboard
      // banner / profile pages immediately see the user as verified
      // without forcing a token refresh round-trip.
      if (session) {
        setSession({
          ...session,
          user: { ...session.user, emailVerified: true },
        });
      }
      toast.success('Email verified — welcome aboard!');
      onVerified?.();
    },
    onError: () => {
      toast.error(friendlyMessage(undefined, 'verify-email'));
      setCode('');
    },
  });

  const resend = useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/otp/request', {
        email,
        purpose: 'email_verify',
      });
    },
    onSuccess: () => {
      toast.success(`New code sent to ${email}`);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    },
    onError: () => {
      toast.error(friendlyMessage(undefined, 'verify-email'));
    },
  });

  const headline = useMemo(
    () => (firstName ? `Hi ${firstName}, check your email` : 'Check your email'),
    [firstName],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
            {headline}
          </h2>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to{' '}
            <span className="font-medium text-foreground">{email}</span>. Enter it below to
            verify your address.
          </p>
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (isCodeComplete) verify.mutate();
        }}
      >
        <OtpInput
          length={OTP_LENGTH}
          value={code}
          onChange={setCode}
          disabled={verify.isPending}
          invalid={verify.isError}
          ariaLabel="Verification code"
        />

        <Button
          type="submit"
          disabled={!isCodeComplete || verify.isPending}
          className="h-11 w-full text-base font-semibold gap-2"
        >
          {verify.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </>
          ) : (
            'Verify email'
          )}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={() => resend.mutate()}
          disabled={resend.isPending || resendCooldown > 0}
          className="inline-flex items-center gap-1.5 font-medium text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground"
        >
          {resend.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCcw className="h-3.5 w-3.5" />
          )}
          {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
        </button>
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Skip for now
          </button>
        ) : null}
      </div>
    </div>
  );
}
