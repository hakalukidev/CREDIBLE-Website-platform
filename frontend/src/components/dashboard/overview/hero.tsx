'use client';

/**
 * Premium featured welcome card for the dashboard Overview.
 *
 * Wraps the existing `SectionCard featured` primitive so we inherit:
 * - the soft primary-tinted gradient backdrop
 * - chrome geometry (rounded-2xl + shadow-card)
 * - the inner surface tokens used across the rest of the dashboard
 *
 * Renders greeting + subtitle + role badges on the left, with a
 * contextual primary CTA on the right that adapts to what the user
 * actually owns.
 */

import Link from 'next/link';
import { Sparkles, ArrowRight, Building2, ShieldCheck } from 'lucide-react';
import { SectionCard } from '../primitives/section-card';
import { IconTile } from '../primitives/icon-tile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MotionFadeUp } from '@/components/ui/motion-primitives';
import { cn } from '@/lib/utils';

interface OwnedEntityLite {
  id: string;
  slug: string;
  displayName: string;
  status?: string;
  verificationStatus?: string;
}

interface HeroProps {
  firstName: string | null | undefined;
  email?: string | null;
  business: OwnedEntityLite | null | undefined;
  professional: OwnedEntityLite | null | undefined;
  className?: string;
}

interface CtaConfig {
  href: string;
  label: string;
}

function pickCta({
  business,
  professional,
  firstName,
}: {
  business: OwnedEntityLite | null | undefined;
  professional: OwnedEntityLite | null | undefined;
  firstName: string | null | undefined;
}): CtaConfig {
  // If the user owns a business, surface the public page link.
  if (business?.slug) {
    return {
      href: `/business/${business.slug}`,
      label: 'View your business',
    };
  }
  // Same for a professional page.
  if (professional?.slug) {
    return {
      href: `/p/${professional.slug}`,
      label: 'View your professional page',
    };
  }
  // New customer — nudge them to register.
  return {
    href: '/dashboard/register',
    label: 'Register a page',
  };
}

function buildSubtitle({
  firstName,
  business,
  professional,
  email,
}: HeroProps): string {
  const ownsBusiness = Boolean(business?.id);
  const ownsPro = Boolean(professional?.id);
  const greeting = firstName?.trim();

  if (ownsBusiness && ownsPro) {
    return `Here's how your business and professional presence are performing on Credible.`;
  }
  if (ownsBusiness) {
    return `Here's how your business is performing on Credible today.`;
  }
  if (ownsPro) {
    return `Here's how your professional page is performing on Credible today.`;
  }
  if (greeting) {
    return `Welcome aboard — let's get your first page registered on Credible.`;
  }
  if (email) {
    return `Welcome aboard — let's get your first page registered on Credible.`;
  }
  return `Here's a quick look at your dashboard.`;
}

export function Hero({ firstName, email, business, professional, className }: HeroProps) {
  const greetingName = firstName?.trim();
  const greeting = greetingName && greetingName.length > 0 ? `Hi, ${greetingName}` : 'Welcome';
  const subtitle = buildSubtitle({ firstName, email, business, professional });
  const cta = pickCta({ business, professional, firstName });

  return (
    <MotionFadeUp className={className}>
      <SectionCard
        featured
        className="relative overflow-hidden p-6 sm:p-8"
      >
        {/* Decorative radial glow anchored to the top-right corner.
            Purely cosmetic, sit below interactive content. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-primary/25 via-primary/10 to-transparent blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 right-1/3 h-44 w-44 rounded-full bg-gradient-to-tr from-secondary/15 to-transparent blur-2xl"
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4 sm:items-center">
            <IconTile icon={<Sparkles className="h-5 w-5" />} tone="primary" size="md" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Welcome back
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {greeting}
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
                {subtitle}
              </p>

              {(business?.id || professional?.id) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {business?.id && (
                    <Badge variant="secondary" className="gap-1">
                      <Building2 className="h-3.5 w-3.5" /> Business owner
                    </Badge>
                  )}
                  {professional?.id && (
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Professional
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          <Button
            asChild
            size="sm"
            className={cn(
              'shrink-0 gap-2 self-start shadow-pop sm:self-auto',
              !business?.id && !professional?.id && 'sm:self-center',
            )}
          >
            <Link href={cta.href as never}>
              {cta.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </SectionCard>
    </MotionFadeUp>
  );
}
