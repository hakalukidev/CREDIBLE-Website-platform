import { redirect } from 'next/navigation';

/**
 * `/register` exists as a shareable URL — landing here opens the global
 * auth modal in signup mode (see `Providers > AuthModalMount`). The
 * page itself renders nothing; the modal is portal-mounted in the root
 * layout.
 */
export default function RegisterPage() {
  if (typeof window === 'undefined') redirect('/');
  return null;
}
