import Link from 'next/link';
import { SafeImage } from '@/components/ui/safe-image';
import { BadgeCheck } from 'lucide-react';

const PRODUCT_LINKS = [
  { href: '/browse', label: 'Browse' },
  { href: '/for-business', label: 'For business' },
  { href: '/for-professionals', label: 'For professionals' },
  { href: '/categories', label: 'Categories' },
];

const COMPANY_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/awards', label: 'Awards' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/guidelines', label: 'Guidelines' },
  { href: '/modern-slavery', label: 'Modern Slavery' },
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
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
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
    <footer className="relative border-t border-border/70 bg-card/40 backdrop-blur-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />

      <div className="container-wide grid grid-cols-2 gap-10 py-14 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Credible — home">
            <span className="relative block h-9 w-9 overflow-hidden rounded-lg bg-white ring-1 ring-black/5 shadow-sm">
              <SafeImage src="/logo.jpg" alt="Credible" fill sizes="36px" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">Credible</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Verified businesses across Bangladesh.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            Human-reviewed
          </div>
        </div>

        <FooterColumn title="Product" links={PRODUCT_LINKS} />
        <FooterColumn title="Company" links={COMPANY_LINKS} />
        <FooterColumn title="Legal" links={LEGAL_LINKS} />
      </div>

      <div className="relative border-t border-border/60">
        <div className="container-wide flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Credible. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/system-status" className="hover:text-primary">
              System status
            </Link>
            <Link href="/privacy#cookies" className="hover:text-primary">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}