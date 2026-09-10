import Link from 'next/link';
import { SafeImage } from '@/components/ui/safe-image';
import { BadgeCheck } from 'lucide-react';

const PRODUCT_LINKS = [
  { href: '/search', label: 'Browse' },
  { href: '/for-business', label: 'For business' },
  { href: '/for-professionals', label: 'For professionals' },
  { href: '/categories', label: 'Categories' },
  { href: '/awards', label: 'Awards' },
];

const COMPANY_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog & News' },
  { href: '/contact', label: 'Contact' },
];

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/guidelines', label: 'Guidelines for Reviewers' },
  { href: '/system-status', label: 'System status' },
  { href: '/modern-slavery', label: 'Modern Slavery Statement' },
  { href: '/privacy#cookies', label: 'Manage cookies' },
];

const PAYMENT_METHODS = ['Visa', 'Mastercard', 'Amex', 'PayPal', 'bKash', 'Nagad'];

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
            <span className="relative block h-9 w-9 overflow-hidden rounded-lg bg-white ring-1 ring-black/5 shadow-sm">
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
        <div className="container-wide flex flex-col items-center justify-between gap-4 py-5 text-xs text-muted-foreground lg:flex-row">
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-3 sm:text-left">
            <p>© {new Date().getFullYear()} Credible. All rights reserved.</p>
            <p className="hidden sm:inline" aria-hidden>·</p>
            <p className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
              Built on trust, not algorithms.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground/70">
              We accept
            </span>
            {PAYMENT_METHODS.map((m) => (
              <span
                key={m}
                className="rounded-md border border-border/70 bg-card px-2 py-0.5 text-[11px] font-medium text-foreground/80"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}