import Link from 'next/link';
import { SafeImage } from '@/components/ui/safe-image';
import { BadgeCheck } from 'lucide-react';

const PRODUCT_LINKS = [
  { href: '/search', label: 'Browse' },
  { href: '/for-business', label: 'For business' },
  { href: '/for-professionals', label: 'For professionals' },
  { href: '/categories', label: 'Categories' },
];

const COMPANY_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/guidelines', label: 'Community Guidelines' },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href as never}
              className="group inline-flex items-center gap-1.5 text-sm text-foreground/80 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border/70 bg-card/40 backdrop-blur-sm">
      {/* Ambient gradient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-64 w-2/3 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl"
      />

      <div className="container-wide relative grid grid-cols-2 gap-10 py-14 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Credible — home">
            <span className="relative block h-9 w-9 overflow-hidden rounded-xl ring-1 ring-black/5 shadow-sm">
              <SafeImage src="/logo.jpg" alt="Credible" fill sizes="36px" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">Credible</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Find, review, and verify trusted businesses and professionals across
            Bangladesh.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            Every badge human-reviewed
          </div>
        </div>

        <FooterColumn title="Product" links={PRODUCT_LINKS} />
        <FooterColumn title="Company" links={COMPANY_LINKS} />
        <FooterColumn title="Legal" links={LEGAL_LINKS} />
      </div>

      <div className="relative border-t border-border/60">
        <div className="container-wide flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Credible. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
            Built on trust, not algorithms.
          </p>
        </div>
      </div>
    </footer>
  );
}