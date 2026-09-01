// app/forgot-password/page.tsx
import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/features/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot password | Credible',
  description: 'Request a one-time code to reset your Credible account password.',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}