// features/auth/register-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { registerSchema, type RegisterInput } from '@credible/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api/client';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { useSession } from '@/lib/store/session';
import { postAuthRedirect } from '@/lib/auth/redirects';
import { useOAuthLogin, getOAuthProviders } from '@/lib/api/oauth';
import {
  User,
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { AuthSession } from '@credible/types';
import { MotionFadeUp, MotionStagger } from '@/components/ui/motion-primitives';

interface RegisterFormProps {
  /**
   * Accepted for API parity with `LoginForm`; this form never renders a
   * header, so the flag is intentionally a no-op.
   */
  bare?: boolean;
  /**
   * Visual variant, matching `LoginForm`'s API so the two screens feel
   * identical.
   *   - 'google'   → form is rendered inside a Google-style centered card.
   *                  Internal submit button moves out to the card footer
   *                  via `externalSubmitId`, OAuth providers are listed
   *                  as a compact column.
   *   - 'shell'    → used with the two-column `AuthModal`; submit button
   *                  stays inside the form.
   *   - 'standalone' (default) → form renders on its own with header +
   *                  OAuth block.
   */
  variant?: 'standalone' | 'shell' | 'google';
  /**
   * Required when `variant="google"`. The submit button at the bottom
   * of the card uses `form={externalSubmitId}` to submit the form
   * externally.
   */
  externalSubmitId?: string;
  /**
   * Optional callback fired whenever the mutation's pending state
   * changes. Lets an external submit button (e.g. the "Next" button in
   * a Google-style card footer) reflect the same loading spinner.
   */
  onPendingChange?: (isPending: boolean) => void;
}

/**
 * New-user registration. The role is locked to CUSTOMER — there is no
 * role picker anymore. A user becomes a BUSINESS or PROFESSIONAL later,
 * by creating a business/professional page from their account. The
 * backend auto-upgrades the role when that profile is created (see
 * `backend/src/modules/businesses/business.service.ts` and the matching
 * professional service).
 */
export function RegisterForm({
  variant = 'standalone',
  externalSubmitId,
  onPendingChange,
}: RegisterFormProps = {}) {
  const router = useRouter();
  const search = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [providers, setProviders] = useState<{ google: boolean; facebook: boolean }>({
    google: false,
    facebook: false,
  });
  const setSession = useSession((s) => s.setSession);
  const oauth = useOAuthLogin();
  const [oauthPending, setOauthPending] = useState<'google' | 'facebook' | null>(null);

  useEffect(() => {
    void getOAuthProviders().then(setProviders);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'CUSTOMER', acceptTerms: true },
  });

  const submit = useMutation({
    mutationFn: async (values: RegisterInput) => {
      const res = await apiClient.post<{ success: true; data: AuthSession }>('/auth/register', {
        ...values,
        // Hard-coded role. Even if the backend schema later accepts more
        // values we never want signup to bypass this.
        role: 'CUSTOMER',
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      setSession(data);
      toast.success('Welcome to Credible!');
      router.push(postAuthRedirect(search, data.user.role) as never);
    },
    onError: (err) => toast.error(friendlyMessage(err, 'register')),
  });

  // Mirror submit.isPending into the parent so an external submit button
  // (e.g. Google-style "Next") can render its own spinner.
  useEffect(() => {
    onPendingChange?.(submit.isPending);
  }, [submit.isPending, onPendingChange]);

  async function handleOAuth(provider: 'google' | 'facebook') {
    setOauthPending(provider);
    try {
      const session = await oauth.loginWith(provider);
      // OAuth signup produces a CUSTOMER by default.
      setSession(session);
      toast.success('Welcome!');
      router.push(postAuthRedirect(search, session.user.role) as never);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Social sign-in failed';
      toast.error(message);
    } finally {
      setOauthPending(null);
    }
  }

  const isGoogle = variant === 'google';

  return (
    <>
      <form
        id={externalSubmitId}
        className={isGoogle ? 'space-y-4' : 'space-y-5 mt-6'}
        onSubmit={handleSubmit((v) => submit.mutate(v))}
      >
        <MotionStagger stagger={0.06}>
          {/* Name Fields */}
          <MotionFadeUp className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="firstName"
                className={isGoogle ? 'text-xs text-[#5F6368]' : 'text-sm font-medium'}
              >
                First name
              </Label>
              <div className="relative">
                {!isGoogle && (
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register('firstName')}
                  className={
                    isGoogle
                      ? 'h-12 rounded-[4px] border-[#DADCE0] bg-white px-3 text-base text-[#202124] placeholder:text-[#80868B] focus-visible:border-[#1A73E8] focus-visible:ring-1 focus-visible:ring-[#1A73E8] transition-shadow'
                      : 'pl-10 h-11 bg-muted/50 border-muted focus:bg-background transition-colors'
                  }
                />
              </div>
              {errors.firstName && (
                <p className="text-xs text-destructive font-medium">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="lastName"
                className={isGoogle ? 'text-xs text-[#5F6368]' : 'text-sm font-medium'}
              >
                Last name
              </Label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...register('lastName')}
                className={
                  isGoogle
                    ? 'h-12 rounded-[4px] border-[#DADCE0] bg-white px-3 text-base text-[#202124] placeholder:text-[#80868B] focus-visible:border-[#1A73E8] focus-visible:ring-1 focus-visible:ring-[#1A73E8] transition-shadow'
                    : 'h-11 bg-muted/50 border-muted focus:bg-background transition-colors'
                }
              />
              {errors.lastName && (
                <p className="text-xs text-destructive font-medium">{errors.lastName.message}</p>
              )}
            </div>
          </MotionFadeUp>

          {/* Email */}
          <MotionFadeUp className={isGoogle ? 'space-y-1' : 'space-y-1.5'}>
            <Label
              htmlFor="email"
              className={isGoogle ? 'text-xs text-[#5F6368]' : 'text-sm font-medium'}
            >
              Email
            </Label>
            <div className="relative">
              {!isGoogle && (
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
              <Input
                id="email"
                type="email"
                placeholder={isGoogle ? '' : 'you@example.com'}
                {...register('email')}
                className={
                  isGoogle
                    ? `h-12 rounded-[4px] border-[#DADCE0] bg-white px-3 text-base text-[#202124] placeholder:text-[#80868B] focus-visible:border-[#1A73E8] focus-visible:ring-1 focus-visible:ring-[#1A73E8] transition-shadow ${errors.email ? 'border-destructive' : ''}`
                    : `pl-10 h-11 bg-muted/50 border-muted focus:bg-background transition-colors ${errors.email ? 'border-destructive' : ''}`
                }
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive font-medium">{errors.email.message}</p>
            )}
          </MotionFadeUp>

          {/* Password */}
          <MotionFadeUp className={isGoogle ? 'space-y-1' : 'space-y-1.5'}>
            <Label
              htmlFor="password"
              className={isGoogle ? 'text-xs text-[#5F6368]' : 'text-sm font-medium'}
            >
              Password
            </Label>
            <div className="relative">
              {!isGoogle && (
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={isGoogle ? '' : 'Create a strong password'}
                {...register('password')}
                className={
                  isGoogle
                    ? `h-12 rounded-[4px] border-[#DADCE0] bg-white px-3 pr-10 text-base text-[#202124] placeholder:text-[#80868B] focus-visible:border-[#1A73E8] focus-visible:ring-1 focus-visible:ring-[#1A73E8] transition-shadow ${errors.password ? 'border-destructive' : ''}`
                    : `pl-10 pr-10 h-11 bg-muted/50 border-muted focus:bg-background transition-colors ${errors.password ? 'border-destructive' : ''}`
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className={
                  isGoogle
                    ? 'absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#202124]'
                    : 'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                }
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
            )}
          </MotionFadeUp>

          {/* Hidden required fields for the shared schema. Users don't
              interact with them — phone stays empty and terms stay true
              so the registration succeeds without forcing two extra UI
              controls onto the signup card. */}
          <input type="hidden" value="CUSTOMER" {...register('role')} />
          <input type="hidden" value="true" {...register('acceptTerms')} />

          {/* Internal submit button — only rendered when this form owns
              its own button (variant !== 'google'). For the Google-style
              shell the page renders its own "Next" button in the card
              footer, which submits via `form={externalSubmitId}`. */}
          {!isGoogle && (
            <MotionFadeUp>
              <Button
                type="submit"
                disabled={submit.isPending}
                className="w-full h-11 text-base font-semibold gap-2"
              >
                {submit.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
              {/* Terms footnote — minimal, matches Google's restraint. */}
              <p className="text-[11px] leading-relaxed text-muted-foreground text-center">
                By creating an account you agree to our{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </MotionFadeUp>
          )}
        </MotionStagger>
      </form>

      {/* OAuth row — same component used by LoginForm. */}
      {(providers.google || providers.facebook) && (
        <div className={isGoogle ? 'mt-6 space-y-3' : 'mt-6 space-y-6'}>
          {!isGoogle && (
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground font-medium tracking-wider">
                or
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          )}

          <div className={isGoogle ? 'flex flex-col gap-2' : 'flex flex-col gap-2.5'}>
            {providers.google && (
              <Button
                type="button"
                variant="outline"
                disabled={oauthPending !== null}
                onClick={() => handleOAuth('google')}
                className={
                  isGoogle
                    ? 'h-10 w-full justify-center gap-2 border-[#DADCE0] bg-white text-[#3C4043] hover:bg-[#F8F9FA]'
                    : 'h-11 w-full justify-center gap-2 whitespace-nowrap hover:bg-muted/50'
                }
              >
                {oauthPending === 'google' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span>Google</span>
              </Button>
            )}
            {providers.facebook && (
              <Button
                type="button"
                variant="outline"
                disabled={oauthPending !== null}
                onClick={() => handleOAuth('facebook')}
                className={
                  isGoogle
                    ? 'h-10 w-full justify-center gap-2 border-[#DADCE0] bg-white text-[#3C4043] hover:bg-[#F8F9FA]'
                    : 'h-11 w-full justify-center gap-2 whitespace-nowrap hover:bg-muted/50'
                }
              >
                {oauthPending === 'facebook' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                )}
                <span>Facebook</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
