import { SubscriptionDialog } from '@/features/business/subscription-dialog';

export const metadata = { title: 'Subscription · Business dashboard' };

/**
 * Route fallback for direct links, refreshes and bookmarks. The dialog is
 * the primary surface — see `features/business/subscription-dialog.tsx`.
 *
 * Gateway-coupled routes (`/business/subscription/plans`,
 * `/business/subscription/checkout`, `/business/subscription/success`,
 * `/business/subscription/failed`, `/business/subscription/invoices`) remain
 * dedicated pages because they need full-window redirects from the payment
 * gateways.
 */
export default function BusinessSubscriptionPage() {
  return <SubscriptionDialog variant="page" />;
}
