import Link from 'next/link';
import { LoginForm } from '@/features/auth/login-form';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Admin sign-in | Credible',
  description: 'Restricted administrator sign-in for the Credible moderation queue.',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Restricted area
          </p>
        </div>
        <LoginForm adminOnly />
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to regular sign-in
          </Link>
        </p>
      </div>
    </div>
  );
}
