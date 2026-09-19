import { VerificationDialog } from '@/features/business/verification-dialog';

export const metadata = { title: 'Verification · Business dashboard' };

/**
 * Route fallback for direct links, refreshes and bookmarks. The dialog is
 * the primary surface — see `features/business/verification-dialog.tsx`.
 */
export default function BusinessVerificationPage() {
  return <VerificationDialog variant="page" />;
}
