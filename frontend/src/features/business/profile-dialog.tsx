'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProfileForm } from '@/features/business/profile-form';
import { VerificationCtaCard } from '@/features/verification/verification-cta-card';

interface BaseProps {
  /**
   * Render the inner body only — used by the `/business/profile` route
   * fallback so the page renders the same content in page form.
   */
  variant?: 'page' | 'dialog';
  /**
   * Optional click handler for the verification banner CTA inside the
   * profile surface. When provided, the banner opens a popup dialog
   * instead of navigating to `/business/verification`.
   *
   * In the dialog variant the host (typically the dashboard layout) wires
   * this to its own `setVerificationOpen(true)` so the banner can swap
   * straight from the profile popup to the verification popup.
   */
  onOpenVerification?: () => void;
}

interface DialogProps extends BaseProps {
  variant?: 'dialog';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PageProps extends BaseProps {
  variant: 'page';
}

type Props = DialogProps | PageProps;

/**
 * Re-usable popup dialog that hosts the business profile editor over the
 * dashboard. Falls back to a plain page rendering when `variant="page"` is
 * passed (used by `/business/profile` for direct-link / refresh support).
 */
export function ProfileDialog(props: Props) {
  const body = (
    <div className="space-y-4">
      {props.variant !== 'page' && (
        <header>
          <h2 className="text-xl font-bold tracking-tight">Profile</h2>
          <p className="text-sm text-muted-foreground">
            Keep your public profile up to date so customers know exactly who
            you are.
          </p>
        </header>
      )}
      <VerificationCtaCard
        target="business"
        onCta={props.onOpenVerification}
      />
      <ProfileForm />
    </div>
  );

  if (props.variant === 'page') {
    return body;
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(96vw,900px)] max-w-none overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>
            Keep your public profile up to date so customers know exactly who
            you are.
          </DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
