// app/register-business/page.tsx
//
// Soft-removed: the role-picker signup flow is gone. Everyone now
// signs up as a customer at /register, then upgrades to a business or
// professional page from their account.
//
// This page is kept as a redirect stub so any inbound links — search
// engines, marketing emails, share dialogs — still resolve to a real
// page rather than a 404. We carry `?next=` through so the user lands
// on the business registration form the moment they finish signing
// up.

import { redirect } from 'next/navigation';

export default function RegisterBusinessLegacyPage(): never {
  redirect('/register?next=/dashboard/register%3Ftype%3Dbusiness');
}
