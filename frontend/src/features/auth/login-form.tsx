// features/auth/login-form.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api/client';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { useSession } from '@/lib/store/session';
import { useOAuthLogin, getOAuthProviders } from '@/lib/api/oauth';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, EyeOff, Eye } from 'lucide-react';
import type { AuthSession, UserRole } from '@credible/types';

/** Returns the URL a freshly-logged-in user should land on, by role. */
function homeForRole(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'BUSINESS':
      return '/business/dashboard';
    case 'PROFESSIONAL':
      return '/professional/dashboard';
    case 'CUSTOMER':
    case 'GUEST':
    default:
      return '/';
  }
}

interface LoginFormProps {
  /** If set, the form lives on /admin/login and forces ADMIN redirect. */
  adminOnly?: boolean;
  /** Display copy override for the admin sign-in flow. */
  title?: string;
  subtitle?: string;
}

export function LoginForm({ adminOnly = false, title, subtitle }: LoginFormProps) {
  const router = useRouter();
  const search = useSearchParams();
  const setSession = useSession((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [providers, setProviders] = useState<{ google: boolean; facebook: boolean }>({
    google: false,
    facebook: false,
  });

  const oauth = useOAuthLogin();
  const [oauthPending, setOauthPending] = useState<'google' | 'facebook' | null>(null);

  useEffect(() => {
    if (adminOnly) return; // admin login is email-only
    void getOAuthProviders().then(setProviders);
  }, [adminOnly]);

  useEffect(() => {
    const failed = search.get('oauth');
    if (failed === 'failed') {
      toast.error('Social sign-in failed. Please try again or use email + password.');
    }
  }, [search]);

  const login = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ success: true; data: AuthSession }>('/auth/login', {
        email,
        password,
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      // Refuse non-admin logins on the admin page.
      if (adminOnly && data.user.role !== 'ADMIN') {
        toast.error('This account does not have admin access.');
        return;
      }
      setSession(data);
      toast.success(adminOnly ? 'Welcome back, admin.' : 'Welcome back!');
      const target = adminOnly ? '/admin' : homeForRole(data.user.role as UserRole);
      const next = search.get('next');
      router.push((next ?? target) as any);
    },
    onError: (err) => toast.error(friendlyMessage(err, 'login')),
  });

  async function handleOAuth(provider: 'google' | 'facebook') {
    setOauthPending(provider);
    try {
      const session = await oauth.loginWith(provider);
      if (adminOnly && session.user.role !== 'ADMIN') {
        toast.error('This account does not have admin access.');
        return;
      }
      toast.success('Welcome!');
      const target = adminOnly ? '/admin' : homeForRole(session.user.role as UserRole);
      const next = search.get('next');
      router.push((next ?? target) as any);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Social sign-in failed';
      toast.error(message);
    } finally {
      setOauthPending(null);
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="pt-8 pb-6 px-6">
        {adminOnly && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin sign-in
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight">
          {title ?? (adminOnly ? 'Administrator sign-in' : 'Sign in to Credible')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {subtitle ??
            (adminOnly
              ? 'Restricted area. Admin credentials only.'
              : 'Welcome back. Pick your account type and continue.')}
        </p>

        <form
          className="space-y-5 mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 bg-muted/50 border-muted focus:bg-background transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Link
                href={'/forgot-password' as never}
                className="text-xs text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 bg-muted/50 border-muted focus:bg-background transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={login.isPending}
            className="w-full h-11 text-base font-semibold gap-2"
          >
            {login.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {!adminOnly && (providers.google || providers.facebook) && (
          <>
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground font-medium tracking-wider">
                Or continue with
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {providers.google && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={oauthPending !== null}
                  onClick={() => handleOAuth('google')}
                  className="h-11 gap-2 hover:bg-muted/50"
                >
                  {oauthPending === 'google' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
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
                  Google
                </Button>
              )}
              {providers.facebook && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={oauthPending !== null}
                  onClick={() => handleOAuth('facebook')}
                  className="h-11 gap-2 hover:bg-muted/50"
                >
                  {oauthPending === 'facebook' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                  Facebook
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
