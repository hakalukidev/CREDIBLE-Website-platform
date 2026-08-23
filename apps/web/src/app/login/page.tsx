import Link from 'next/link';
import { LoginForm } from '@/features/auth/login-form';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <div className="container-narrow py-12">
      <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Welcome back. Sign in to manage your business, write reviews, and more.
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Don’t have an account?{' '}
        <Link href="/register-business" className="text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}