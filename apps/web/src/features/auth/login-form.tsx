// features/auth/login-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient, extractError } from '@/lib/api/client';
import { useSession } from '@/lib/store/session';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import type { AuthSession } from '@credible/types';

export function LoginForm() {
  const router = useRouter();
  const setSession = useSession((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ success: true; data: AuthSession }>('/auth/login', {
        email,
        password,
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      setSession(data);
      toast.success('Welcome back!');
      router.push('/business/dashboard');
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="pt-8 pb-6 px-6">
        <form
          className="space-y-5"
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
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11 bg-muted/50 border-muted focus:bg-background transition-colors"
              />
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

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground font-medium tracking-wider">
            Continue with
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            disabled
            className="h-11 gap-2 hover:bg-muted/50"
            title="Google sign-in will be available soon"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
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
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled
            className="h-11 gap-2 hover:bg-muted/50"
            title="Facebook sign-in will be available soon"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Facebook
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}