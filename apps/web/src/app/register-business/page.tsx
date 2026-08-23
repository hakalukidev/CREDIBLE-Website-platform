import Link from 'next/link';
import { RegisterForm } from '@/features/auth/register-form';

export const metadata = { title: 'Create your Credible account' };

export default function RegisterPage() {
  return (
    <div className="container-narrow py-12">
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Already have one?{' '}
        <Link href="/login" className="text-primary hover:underline">Sign in</Link>
      </p>
      <div className="mt-6">
        <RegisterForm />
      </div>
    </div>
  );
}