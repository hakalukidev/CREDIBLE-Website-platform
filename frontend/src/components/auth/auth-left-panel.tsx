'use client';

import { ShieldCheck, BadgeCheck, MessageSquareQuote } from 'lucide-react';
import { BrandMark } from './brand-mark';

/**
 * Left side of the two-column auth modal — the silent brand storyteller.
 * Decorative only (`hidden` below `lg`): a soft accent surface with a
 * short headline and compact trust chips so the marketing message stays
 * tight and the form remains the focal point.
 */
export function AuthLeftPanel() {
  return (
    <div className="relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600/10 via-primary/5 to-background px-8 py-10 lg:flex">
      {/* Decorative dotted grid in the right edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-3/5 bg-[radial-gradient(circle_at_1px_1px,theme(colors.primary/15)_1px,transparent_0)] opacity-50 [background-size:18px_18px] [mask-image:linear-gradient(to_left,black,transparent)]"
      />
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-brand-500/20 to-transparent blur-3xl"
      />

      <div className="relative">
        <BrandMark brand="Credible" tagline="Verified reviews" />
      </div>

      <div className="relative">
        <h2 className="font-display text-[32px] font-semibold leading-tight tracking-tight text-foreground">
          Trust before you decide.
        </h2>
        <ul className="mt-6 space-y-2.5">
          <TrustChip icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Verified businesses only" />
          <TrustChip icon={<BadgeCheck className="h-3.5 w-3.5" />} label="Humans review every badge" />
          <TrustChip icon={<MessageSquareQuote className="h-3.5 w-3.5" />} label="OTP-confirmed reviews" />
        </ul>
      </div>

      <p className="relative text-xs text-muted-foreground">
        User&apos;s trust layer for businesses and professionals.
      </p>
    </div>
  );
}

interface TrustChipProps {
  icon: React.ReactNode;
  label: string;
}

function TrustChip({ icon, label }: TrustChipProps) {
  return (
    <li className="flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/50 py-1.5 pl-2 pr-3.5 text-xs font-medium text-foreground/90 shadow-sm backdrop-blur">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-primary text-primary-foreground">
        {icon}
      </span>
      {label}
    </li>
  );
}