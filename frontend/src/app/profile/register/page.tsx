'use client';

/**
 * /profile/register — Step 1 of the public register wizard.
 *
 * Hosts the same `<RegisterWizard>` component the dashboard used to,
 * but under the public profile chrome. The wizard handles ?type=
 * internally: with no query string it shows the choice step, with
 * ?type=business or ?type=professional it skips straight to step 2.
 *
 * Auth required. If the user is already a BUSINESS or PROFESSIONAL
 * the wizard's role-mismatch guard will warn them before they
 * accidentally create a duplicate page.
 */

import { RequireAuth } from '@/components/auth/require-auth';
import { RegisterWizard } from '@/components/profile-v2/register/register-wizard';

export default function ProfileRegisterPage() {
  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Get on Credible
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Register a page
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Set up your business or professional page in two short steps. The
            same forms power the rest of the platform — pick a kind and we
            take it from there.
          </p>
        </div>
        <div className="mt-8">
          <RegisterWizard />
        </div>
      </div>
    </RequireAuth>
  );
}
