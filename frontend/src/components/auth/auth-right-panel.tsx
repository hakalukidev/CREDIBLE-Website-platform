'use client';

import { Suspense, useState } from 'react';
import { LoginForm } from '@/features/auth/login-form';
import { RegisterForm } from '@/features/auth/register-form';
import { cn } from '@/lib/utils';
import { MotionFadeUp } from '@/components/ui/motion-primitives';

type Mode = 'signin' | 'signup';

const COPY: Record<Mode, { title: string; subtitle: string }> = {
  signin: {
    title: 'Welcome back',
    subtitle: 'Sign in to continue to Credible.',
  },
  signup: {
    title: 'Create your account',
    subtitle: 'Join the trust layer for businesses in Bangladesh.',
  },
};

interface AuthRightPanelProps {
  initialMode?: Mode;
}

/**
 * Right side of the two-column auth modal — heading + active form
 * (sign-in or sign-up) + mode-toggle footer. The form is delegated to
 * `LoginForm` / `RegisterForm` so all business logic, validation,
 * OAuth handling, and post-auth redirects stay in one place.
 */
export function AuthRightPanel({ initialMode = 'signin' }: AuthRightPanelProps = {}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [submitting, setSubmitting] = useState(false);
  const copy = COPY[mode];

  return (
    <div className="flex h-full flex-col p-6 sm:p-8">
      <div className="flex-1">
        <MotionFadeUp key={mode}>
          <header className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[26px]">
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
                <RegisterForm bare variant="shell" onPendingChange={setSubmitting} />
              )}
            </div>
          </Suspense>
        </div>
      </div>

      <div className="mt-6 border-t border-border/60 pt-4 text-center text-sm text-muted-foreground">
        {mode === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => setMode('signup')}
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
              onClick={() => setMode('signin')}
              className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
