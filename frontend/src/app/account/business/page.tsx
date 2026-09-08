'use client';

import { AccountShell } from '@/components/account/account-shell';

/**
 * /account/business — Business / Professional tab landing. The actual
 * picker + form is lazy-loaded inside AccountShell.
 */
export default function AccountBusinessPage() {
  return <AccountShell defaultTab="business" />;
}
