'use client';

import { Suspense, useState } from 'react';
import { LoginForm } from '@/features/auth/login-form';
import { RegisterForm } from '@/features/auth/register-form';
import { VerifyEmailPanel } from './verify-email-panel';
import { cn } from '@/lib/utils';
import { MotionFadeUp } from '@/components/ui/motion-primitives';
import type { AuthSession } from '@credible/types';

export type AuthMode = 'signin' | 'signup' | 'verify';

const COPY: Record<AuthMode, { title: string; subtitle: string }> = {
  signin: {
    title: 'Welcome back',
    subtitle: 'Sign in to continue.',
  },
  signup: {
    title: 'Create your account',
    subtitle: 'Join Credible in seconds.',
  },
  verify: {
    title: 'Verify your email',
    subtitle: 'One last step to keep your account secure.',
  },
};

interface AuthRightPanelProps {
  mode: AuthMode;
  /** Email used when `mode === 'verify'`. The panel uses it both
   *  to display the destination address and as the payload for the OTP
   *  request/verify calls. */
  verifyEmail?: string;
  /** Optional first name used in the verify panel's greeting. */
  verifyFirstName?: string;
  /** Fired after a successful OTP verification — parent typically closes
   *  the modal and lands the user on their dashboard. */
  onVerified?: () => void;
  /** Fired when the verify panel's "Skip for now" button is pressed. */
  onVerifySkip?: () => void;
  /** Mode toggle for the signin↔signup footer. Hidden in verify mode. */
  onModeChange?: (mode: Exclude<AuthMode, 'verify'>) => void;
  /** Called when a signup succeeds. Parent decides whether to close
   *  the modal (pre-verified account) or flip into 'verify' mode. */
  onSignupSuccess?: (session: AuthSession) => void;
}

/**
 * Right side of the two-column auth modal — heading + active form
 * (sign-in or sign-up) + mode-toggle footer. The form is delegated to
 * `LoginForm` / `RegisterForm` so all business logic, validation,
 * OAuth handling, and post-auth redirects stay in one place.
 *
 * `verify` mode renders `VerifyEmailPanel` and skips the toggle footer
 * because the user has just registered — flipping back to sign-in
 * would be confusing at this point.
 */
export function AuthRightPanel({
  mode,
  verifyEmail,
  verifyFirstName,
  onVerified,
  onVerifySkip,
  onModeChange,
  onSignupSuccess,
}: AuthRightPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const copy = COPY[mode];

  return (
    <div className="flex flex-col px-6 py-8 sm:px-10 sm:py-10">
      <div className="flex-1">
        {mode === 'verify' ? (
          <MotionFadeUp key="verify">
            <header className="space-y-1.5">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                {copy.title}
              </h1>
              <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
            </header>
            <div className="mt-6">
              <VerifyEmailPanel
                email={verifyEmail ?? ''}
                firstName={verifyFirstName}
                onVerified={onVerified}
                onSkip={onVerifySkip}
              />
            </div>
          </MotionFadeUp>
        ) : (
          <>
            <MotionFadeUp key={mode}>
              <header className="space-y-1.5">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                  {copy.title}
                </h1>
                <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
              </header>
            </MotionFadeUp>

            <div className="mt-6">
              <Suspense fallback={null}>
                <div
                  className={cn(
                    'transition-opacity duration-200',
                    submitting && 'pointer-events-none opacity-60',
                  )}
                >
                  {mode === 'signin' ? (
                    <LoginForm bare variant="shell" onPendingChange={setSubmitting} />
                  ) : (
                    <RegisterForm
                      variant="shell"
                      onPendingChange={setSubmitting}
                      onRegistered={onSignupSuccess}
                    />
                  )}
                </div>
              </Suspense>
            </div>
          </>
        )}
      </div>

      {mode !== 'verify' && (
        <div className="mt-6 border-t border-border/60 pt-4 text-center text-sm text-muted-foreground">
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => onModeChange?.('signup')}
                className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onModeChange?.('signin')}
                className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
