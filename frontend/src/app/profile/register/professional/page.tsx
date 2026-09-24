'use client';

/**
 * /profile/register/professional — direct entry to step 2 with the
 * Professional kind preselected. Mirrors `.../business/page.tsx`.
 */

import { Suspense } from 'react';
import { RequireAuth } from '@/components/auth/require-auth';
import { RegisterWizard } from '@/components/profile-v2/register/register-wizard';

function ProfessionalRegistrationShell() {
  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Get on Credible
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Register your professional page
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Showcase your specialties, experience, and the credentials that
            matter to your clients. You can edit everything after publishing.
          </p>
        </div>
        <div className="mt-8">
          <RegisterWizard
            routes={{ details: '/profile/register/professional' }}
            initialKindOverride="professional"
          />
        </div>
      </div>
    </RequireAuth>
  );
}

export default function ProfessionalRegisterPage() {
  return (
    <Suspense fallback={null}>
      <ProfessionalRegistrationShell />
    </Suspense>
  );
}
