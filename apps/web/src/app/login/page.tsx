// app/login/page.tsx
import Link from 'next/link';
import { LoginForm } from '@/features/auth/login-form';
import { Building2, Shield, Star } from 'lucide-react';

export const metadata = {
  title: 'Sign in | Credible',
  description: 'Sign in to your Credible account to manage your business, write reviews, and more.',
};

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Form */}
        <LoginForm />

        {/* Footer */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/register-business"
              className="font-semibold text-primary hover:underline transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}