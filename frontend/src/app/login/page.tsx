import { redirect } from 'next/navigation';

/**
 * `/login` exists as a shareable URL — landing here opens the global
 * auth modal (see `Providers > AuthModalMount`). The page itself
 * renders nothing; the modal is portal-mounted in the root layout.
 *
 * On the rare case this route is hit before client hydration (e.g. a
 * no-JS crawler), redirect to home so we never serve a blank screen.
 */
export default function LoginPage() {
  if (typeof window === 'undefined') redirect('/');
  return null;
}
