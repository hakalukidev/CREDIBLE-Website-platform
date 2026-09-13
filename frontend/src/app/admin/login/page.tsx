import { Suspense } from 'react';
import { AdminLoginForm } from '@/components/admin/admin-login-form';
import { ShieldCheck, KeyRound } from 'lucide-react';

export const metadata = {
  title: 'Admin Access | Credible',
  description: 'Restricted administrator sign-in for the Credible moderation console.',
  robots: { index: false, follow: false },
};

/**
 * The standalone gateway. This is a hidden route — there are no public links
 * pointing to it. It is reached either by visiting `/admin/login` directly or
 * (on the public site) through the Shift + Alt + A secret shortcut, which
 * opens the gateway modal.
 */
export default function AdminLoginPage() {
  return (
    <div className="admin-shell flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 shadow-lg">
            <KeyRound className="h-6 w-6 text-rose-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold uppercase tracking-widest text-zinc-200">
              Admin Access
            </h1>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-zinc-500">
              <ShieldCheck className="h-3.5 w-3.5" /> Restricted area · authorized personnel only
            </p>
          </div>
        </div>
        <Suspense fallback={null}>
          <AdminLoginForm />
        </Suspense>
        <p className="mt-4 text-center text-[11px] text-zinc-600">
          Every access attempt is logged to the audit trail.
        </p>
      </div>
    </div>
  );
}