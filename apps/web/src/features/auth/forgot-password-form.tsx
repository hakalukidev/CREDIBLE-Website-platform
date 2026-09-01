// features/auth/forgot-password-form.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient, extractError } from '@/lib/api/client';

/**
 * Forgot password form. Posts the email to the existing OTP endpoint
 * (`POST /auth/otp/request` with purpose `email_verify`) so the backend
 * can dispatch the recovery code. We intentionally reuse the OTP
 * infrastructure rather than introducing a new endpoint — the request
 * is rate-limited and the email template is already wired up server-side.
 *
 * On success we display a confirmation state rather than redirect, so the
 * user knows to check their inbox even if no account exists for the
 * given email (we never leak account existence).
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = useMutation({
    mutationFn: async (value: string) => {
      await apiClient.post('/auth/otp/request', {
        email: value.trim(),
        purpose: 'email_verify',
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success('If that email is registered, a reset code is on the way.');
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  if (submitted) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-8 pb-6 px-6 space-y-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a one-time
              code you can use to reset your password. The code expires in 15 minutes.
            </p>
          </div>
          <div className="rounded-md border bg-muted/40 p-3 text-left text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Didn&apos;t get the email?</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              <li>Check your spam or junk folder.</li>
              <li>Make sure you entered the email you signed up with.</li>
              <li>Wait a minute — delivery can be delayed in rare cases.</li>
            </ul>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="pt-8 pb-6 px-6">
        <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the email address on your account and we&apos;ll send you a one-time code to
          reset your password.
        </p>

        <form
          className="mt-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isValidEmail) return;
            submit.mutate(email);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Email address
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
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!isValidEmail || submit.isPending}
            className="w-full h-11 text-base font-semibold gap-2"
          >
            {submit.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending code…
              </>
            ) : (
              <>
                Send reset code
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}