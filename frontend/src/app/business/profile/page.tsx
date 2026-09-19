import { ProfileDialog } from '@/features/business/profile-dialog';

export const metadata = { title: 'Profile · Business dashboard' };

/**
 * Route fallback for direct links, refreshes and bookmarks. The dialog is
 * the primary surface — see `features/business/profile-dialog.tsx`.
 */
export default function BusinessProfilePage() {
  return <ProfileDialog variant="page" />;
}
