'use client';

/**
 * /profile/register/business — direct entry to step 2 with the
 * Business kind preselected. Useful for marketing links that already
 * know which kind the visitor wants. The wizard renders identically
 * to `/profile/register?type=business` — the only difference is the
 * canonical URL.
 */

import { Suspense } from 'react';
import { RequireAuth } from '@/components/auth/require-auth';
import { RegisterWizard } from '@/components/profile-v2/register/register-wizard';

function BusinessRegistrationShell() {
  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Get on Credible
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Register your business
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Add your logo, hours, and the details that show up on your public
            Credible page. You can edit everything after publishing.
          </p>
        </div>
        <div className="mt-8">
          {/* The wizard reads `?type=` from the URL; force `business` here so
              a bare hit of this page lands directly on step 2. */}
          <RegisterWizard
            routes={{ details: '/profile/register/business' }}
            initialKindOverride="business"
          />
        </div>
      </div>
    </RequireAuth>
  );
}

export default function BusinessRegisterPage() {
  return (
    <Suspense fallback={null}>
      <BusinessRegistrationShell />
    </Suspense>
  );
}
