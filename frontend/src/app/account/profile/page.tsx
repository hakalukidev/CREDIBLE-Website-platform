'use client';

import { AccountShell } from '@/components/account/account-shell';

/**
 * /account/profile — Profile tab landing. AccountShell lazy-loads
 * the actual content via dynamic import.
 */
export default function AccountProfilePage() {
  return <AccountShell defaultTab="profile" />;
}
