// app/register-business/page.tsx
import Link from 'next/link';
import { RegisterForm } from '@/features/auth/register-form';
import { UserPlus, Sparkles, Shield, Users } from 'lucide-react';

export const metadata = {
  title: 'Create your Credible account',
  description: 'Join Credible to write reviews, manage your business, and connect with your community.',
};

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Form */}
        <RegisterForm />
      </div>
    </div>
  );
}