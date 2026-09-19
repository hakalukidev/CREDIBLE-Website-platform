import { redirect } from 'next/navigation';

/**
 * /professionals is a marketing-friendly entry point that resolves to the
 * actual professionals directory. Implemented as a server-side redirect so
 * every existing `<Link href="/professionals">` keeps working without
 * client-side JS.
 */
export default function ProfessionalsIndexPage(): never {
  redirect('/professionals/search');
}
