'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Lock, Mail, ShieldCheck, Smartphone, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { friendlyMessage } from '@/components/ui/friendly-error';
import { useAdminLogin, useAdminRequestOtp } from '@/features/admin/admin-auth-hooks';
import type { Route } from 'next';

interface AdminLoginFormProps {
  /** Called after a successful login (the form already navigates to /admin). */
  onSuccess?: () => void;
  /** Rendered inside a dialog — tighter spacing, no outer card. */
  embedded?: boolean;
}

/**
 * Dedicated admin gateway sign-in. Never touches the public user session:
 * email/phone + password (+ optional 2FA code). All failure modes surface the
 * same generic "Invalid credentials" from the backend.
 */
export function AdminLoginForm({ onSuccess, embedded = false }: AdminLoginFormProps) {
  const router = useRouter();
  const search = useSearchParams();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [awaitingCode, setAwaitingCode] = useState(false);

  const login = useAdminLogin();
  const requestOtp = useAdminRequestOtp();

  const redirectAfterLogin = () => {
    const next = search.get('next');
    // Open-redirect guard — only allow internal admin paths.
    const safeNext =
      next && next.startsWith('/admin') && !next.includes('://') ? next : '/admin/dashboard';
    onSuccess?.();
    router.push(safeNext as Route);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const vars = { loginId: loginId.trim(), password, otp: awaitingCode ? otp : undefined };

    try {
      const result = await login.mutateAsync(vars);
      if ('twoFactorRequired' in result && result.twoFactorRequired) {
        setAwaitingCode(true);
        // Fire the one-time code automatically; the user just enters it.
        await requestOtp.mutateAsync({ loginId: loginId.trim(), password });
        toast.success('Admin access code sent to your inbox.');
        return;
      }
      redirectAfterLogin();
    } catch (err) {
      toast.error(friendlyMessage(err, 'admin'));
    }
  }

  const isPending = login.isPending || requestOtp.isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className={embedded ? 'space-y-4' : 'space-y-5 rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl'}
    >
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          {awaitingCode ? 'Two-factor verification' : 'Secure gateway'}
        </p>
        <ShieldCheck className="h-4 w-4 text-rose-500" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-login-id" className="text-sm font-medium text-zinc-300">
          Email or phone
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            id="admin-login-id"
            autoComplete="username"
            required
            placeholder="admin@credible.example"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            disabled={awaitingCode}
            className="h-11 border-zinc-800 bg-zinc-900 pl-10 text-zinc-100 placeholder:text-zinc-600 focus:border-rose-600 focus:ring-rose-600/30"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="admin-password" className="text-sm font-medium text-zinc-300">
            Password
          </Label>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={awaitingCode}
            className="h-11 border-zinc-800 bg-zinc-900 pl-10 text-zinc-100 placeholder:text-zinc-600 focus:border-rose-600 focus:ring-rose-600/30"
          />
        </div>
      </div>

      {awaitingCode && (
        <div className="space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <Label htmlFor="admin-otp" className="flex items-center gap-1.5 text-sm font-medium text-zinc-300">
            <Smartphone className="h-3.5 w-3.5" /> One-time code
          </Label>
          <Input
            id="admin-otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
            className="h-11 border-zinc-800 bg-zinc-900 text-center text-lg tracking-[0.4em] text-zinc-100 placeholder:text-zinc-600 focus:border-rose-600 focus:ring-rose-600/30"
          />
          <button
            type="button"
            onClick={() => requestOtp.mutate({ loginId: loginId.trim(), password })}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Resend code
          </button>
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 w-full gap-2 bg-rose-600 text-base font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Authorizing…
          </>
        ) : (
          <>
            {awaitingCode ? 'Verify & sign in' : 'Sign in'}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}