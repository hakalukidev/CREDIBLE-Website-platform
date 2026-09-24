'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Cookie,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SafeImage } from '@/components/ui/safe-image';
import { cn } from '@/lib/utils';

/**
 * Credible site footer.
 *
 * Layout: 4-column responsive grid (≥1024px).
 *   Col 1 — Brand + tagline + social row (wider)
 *   Col 2 — Legal links (per spec, exact ordering)
 *   Col 3 — Platform / quick links
 *   Col 4 — Payment options (Stripe, PayPal, Visa/Mastercard, bank)
 *
 * On tablet (768-1023): 2x2 grid.
 * On mobile (<768): single column stack.
 * All copy kept generic + international — no region-specific references.
 */

interface FooterLink {
  href?: string;
  label: string;
  external?: boolean;
  onClick?: () => void;
}

interface PaymentLogo {
  name: string;
  short: string;
  /** Tailwind text-* class used as the default "grayscale" tone. */
  tone: string;
}

const LEGAL_LINKS: FooterLink[] = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { label: 'Manage Cookies', onClick: '__cookies__' } as unknown as FooterLink & {
    onClick: '__cookies__';
  },
  { href: '/modern-slavery', label: 'Modern Slavery Statement' },
];

const PLATFORM_LINKS: FooterLink[] = [
  { href: '/about', label: 'About Us' },
  { href: '/guidelines', label: 'Guidelines for Reviewers' },
  { href: 'https://status.credible.com', label: 'System Status', external: true },
  { href: '/contact', label: 'Contact Us' },
];

const SOCIAL_LINKS = [
  { icon: Facebook, href: 'https://facebook.com', label: 'Credible on Facebook' },
  { icon: Twitter, href: 'https://twitter.com', label: 'Credible on X' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'Credible on LinkedIn' },
  { icon: Instagram, href: 'https://instagram.com', label: 'Credible on Instagram' },
  { icon: Youtube, href: 'https://youtube.com', label: 'Credible on YouTube' },
];

const PAYMENT_LOGOS: PaymentLogo[] = [
  { name: 'Stripe', short: 'S', tone: 'text-[#635BFF]' },
  { name: 'PayPal', short: 'PP', tone: 'text-[#003087]' },
  { name: 'Visa / Mastercard', short: 'V/M', tone: 'text-[#111827]' },
  { name: 'Bank Transfer', short: 'BT', tone: 'text-[#7C3AED]' },
];

const BOTTOM_LINKS: FooterLink[] = [
  { href: '/sitemap.xml', label: 'Sitemap' },
  { href: '/accessibility', label: 'Accessibility' },
  { label: 'Cookie Settings', onClick: '__cookies__' } as unknown as FooterLink & {
    onClick: '__cookies__';
  },
  { href: '/privacy#do-not-sell', label: 'Do Not Sell My Info' },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function FadeColumn({
  index,
  children,
  className,
}: {
  index: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FooterLinkItem({
  link,
  active,
  onCookies,
}: {
  link: FooterLink;
  active?: boolean;
  onCookies: () => void;
}) {
  const labelEl = (
    <span
      className={cn(
        'relative inline-block transition-colors duration-200',
        active ? 'text-primary' : 'text-gray-700 hover:text-primary',
      )}
      data-active={active ? 'true' : undefined}
    >
      {link.label}
      <span
        aria-hidden
        className={cn(
          'absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-primary transition-transform duration-200',
          !active && 'group-hover:scale-x-100',
          active && 'scale-x-100',
        )}
      />
    </span>
  );

  // Manage Cookies / Cookie Settings triggers the modal instead of routing.
  if ((link as { onClick?: string }).onClick === '__cookies__') {
    return (
      <li>
        <button
          type="button"
          onClick={onCookies}
          className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          {labelEl}
        </button>
      </li>
    );
  }

  if (link.external) {
    return (
      <li>
        <Link
          href={(link.href ?? '/') as never}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          {labelEl}
          <ExternalLink
            aria-hidden
            className="h-3 w-3 -translate-y-px text-gray-400 transition-colors group-hover:text-primary"
          />
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={(link.href ?? '/') as never}
        aria-current={active ? 'page' : undefined}
        className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        {labelEl}
      </Link>
    </li>
  );
}

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 font-display text-[15px] font-semibold tracking-tight text-gray-900 md:text-base">
      {children}
    </h3>
  );
}

function SocialRow() {
  return (
    <ul className="flex items-center gap-3" aria-label="Social media">
      {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
        <li key={href}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary hover:text-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <Icon className="h-4 w-4" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}

function PaymentGrid() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {PAYMENT_LOGOS.map((logo) => (
          <div
            key={logo.name}
            className="group flex h-12 items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.04] hover:border-primary/40 hover:shadow-md"
            title={logo.name}
          >
            <span
              className={cn(
                'flex h-7 w-10 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-[10px] font-bold tracking-wider transition-colors duration-300 group-hover:bg-white group-hover:border-primary/30',
                logo.tone,
              )}
              aria-hidden
            >
              {logo.short}
            </span>
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-tight text-gray-700 transition-colors duration-300 group-hover:text-gray-900">
              {logo.name}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[12px] leading-relaxed text-gray-500">
        Secure payments powered by trusted gateways.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/*  Cookie preferences modal                                                 */
/* ------------------------------------------------------------------------- */

interface CookieCategory {
  id: 'essential' | 'analytics' | 'marketing';
  label: string;
  description: string;
  required?: boolean;
}

const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'essential',
    label: 'Essential',
    description: 'Required for sign-in, security, and basic site features. Always on.',
    required: true,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Helps us understand traffic patterns so we can improve the product.',
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Personalised offers and ads on other websites you visit.',
  },
];

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_PREFS: CookiePreferences = {
  essential: true,
  analytics: true,
  marketing: false,
};

function CookiePreferencesModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [prefs, setPrefs] = React.useState<CookiePreferences>(DEFAULT_PREFS);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem('credible.cookie-prefs');
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CookiePreferences>;
        setPrefs({ ...DEFAULT_PREFS, ...parsed, essential: true });
      }
    } catch {
      /* ignore — fresh preferences */
    }
  }, [open]);

  const toggle = (id: keyof CookiePreferences) => {
    if (id === 'essential') return;
    setPrefs((p) => ({ ...p, [id]: !p[id] }));
  };

  const save = () => {
    try {
      localStorage.setItem('credible.cookie-prefs', JSON.stringify(prefs));
    } catch {
      /* private mode etc. — accept silently */
    }
    setSavedAt(new Date().toLocaleTimeString());
    window.setTimeout(() => onOpenChange(false), 350);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border border-gray-200 bg-white p-0 shadow-xl">
        <DialogHeader className="border-b border-gray-100 px-6 pb-4 pt-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Cookie className="h-4 w-4" aria-hidden />
            </span>
            <DialogTitle className="font-display text-base font-semibold text-gray-900">
              Cookie preferences
            </DialogTitle>
          </div>
          <DialogDescription className="pt-1.5 text-[13px] leading-relaxed text-gray-600">
            Choose how Credible uses cookies. Essential cookies are always on so the site
            works; the others are up to you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-6 py-5">
          {COOKIE_CATEGORIES.map((cat) => {
            const enabled = prefs[cat.id];
            return (
              <div
                key={cat.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{cat.label}</span>
                    {cat.required && (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-success">
                        Always on
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-gray-600">
                    {cat.description}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`${cat.label} cookies`}
                  disabled={cat.required}
                  onClick={() => toggle(cat.id)}
                  className={cn(
                    'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                    enabled ? 'bg-primary' : 'bg-gray-300',
                    cat.required && 'cursor-not-allowed opacity-70',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200',
                      enabled ? 'left-[22px]' : 'left-0.5',
                    )}
                  />
                </button>
              </div>
            );
          })}

          {savedAt && (
            <p className="text-[11px] text-success">Preferences saved at {savedAt}.</p>
          )}
        </div>

        <DialogFooter className="border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <Button
            variant="outline"
            className="h-9 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button className="h-9 rounded-full shadow-sm" onClick={save}>
            Save preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------------- */
/*  Public site footer                                                       */
/* ------------------------------------------------------------------------- */

export function SiteFooter() {
  const pathname = usePathname();
  const [cookiesOpen, setCookiesOpen] = React.useState(false);

  return (
    <>
      <footer
        role="contentinfo"
        aria-label="Site footer"
        className="border-t border-[#E5E7EB] bg-[#F9FAFB]"
      >
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 md:px-8">
          {/* Main columns */}
          <div className="grid grid-cols-1 gap-10 py-12 md:grid-cols-2 md:gap-12 md:py-14 md:px-5 md:py-16 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
            {/* Col 1 — Brand + tagline + social + trust badge */}
            <FadeColumn index={0} className="md:col-span-2 lg:col-span-1">
              <Link
                href="/"
                className="inline-flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9FAFB]"
                aria-label="Credible — home"
              >
                <span className="relative block h-10 w-10 overflow-hidden rounded-[10px] bg-white ring-1 ring-black/5 shadow-sm">
                  <SafeImage src="/logo.jpg" alt="Credible" fill sizes="40px" priority />
                </span>
                <span className="font-display text-xl font-bold tracking-tight text-gray-900">
                  Credible
                </span>
              </Link>
              <p className="mt-4 max-w-[28ch] text-[14px] leading-relaxed text-gray-500">
                Building trust in the digital economy.
              </p>

              <div className="mt-6">
                <SocialRow />
              </div>

              <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3.5 py-2 text-xs font-medium text-primary shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Trusted by users worldwide
              </div>
            </FadeColumn>

            {/* Col 2 — Legal */}
            <FadeColumn index={1}>
              <ColumnHeading>Legal</ColumnHeading>
              <ul className="space-y-2.5 text-sm">
                {LEGAL_LINKS.map((link) => (
                  <FooterLinkItem
                    key={link.label}
                    link={link}
                    active={!!link.href && isActive(pathname, link.href)}
                    onCookies={() => setCookiesOpen(true)}
                  />
                ))}
              </ul>
            </FadeColumn>

            {/* Col 3 — Platform / quick links */}
            <FadeColumn index={2}>
              <ColumnHeading>Platform</ColumnHeading>
              <ul className="space-y-2.5 text-sm">
                {PLATFORM_LINKS.map((link) => (
                  <FooterLinkItem
                    key={link.label}
                    link={link}
                    active={!!link.href && isActive(pathname, link.href)}
                    onCookies={() => setCookiesOpen(true)}
                  />
                ))}
              </ul>
            </FadeColumn>

            {/* Col 4 — Payments */}
            <FadeColumn index={3} className="md:col-span-2 lg:col-span-1">
              <h3 className="mb-4 flex items-center gap-1.5 font-display text-[15px] font-semibold tracking-tight text-gray-900 md:text-base">
                <CreditCard className="h-4 w-4 text-primary" aria-hidden />
                We Accept
              </h3>
              <PaymentGrid />
            </FadeColumn>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-[#E5E7EB] py-6">
            <div className="flex flex-col items-center gap-3 text-[13px] text-gray-500 sm:flex-row sm:justify-between">
              <p>© 2026 Credible. All rights reserved.</p>
              <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                {BOTTOM_LINKS.map((link) => (
                  <FooterLinkItem
                    key={link.label}
                    link={link}
                    active={!!link.href && isActive(pathname, link.href)}
                    onCookies={() => setCookiesOpen(true)}
                  />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>

      <CookiePreferencesModal open={cookiesOpen} onOpenChange={setCookiesOpen} />
    </>
  );
}
