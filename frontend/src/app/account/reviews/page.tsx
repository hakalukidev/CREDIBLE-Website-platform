'use client';

/**
 * /account/reviews — kept as a real route so old links and bookmarks
 * still resolve. Renders the AccountShell which lazy-loads each tab's
 * content via dynamic import.
 */

import { AccountShell } from '@/components/account/account-shell';

export default function AccountReviewsPage() {
  return <AccountShell defaultTab="reviews" />;
}
