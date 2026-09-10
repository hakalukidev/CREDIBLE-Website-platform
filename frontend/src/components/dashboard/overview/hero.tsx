'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, Building2, Stethoscope } from 'lucide-react';
import { SectionCard } from '../primitives/section-card';
import { IconTile } from '../primitives/icon-tile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MotionFadeUp } from '@/components/ui/motion-primitives';

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

function buildSubtitle({
  firstName,
  business,
  professional,
}: {
  firstName: string | null | undefined;
  business: OwnedEntityLite | null | undefined;
  professional: OwnedEntityLite | null | undefined;
}): string {
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
    return `Welcome aboard — let's get you set up on Credible.`;
  }
  return `Here's a quick look at your dashboard.`;
}

export function Hero({ firstName, business, professional, className }: HeroProps) {
  const greetingName = firstName?.trim();
  const greeting = greetingName && greetingName.length > 0 ? `Hi, ${greetingName}` : 'Welcome';
  const subtitle = buildSubtitle({ firstName, business, professional });
  const hasNoEntities = !business?.id && !professional?.id;

  return (
    <MotionFadeUp className={className}>
      <SectionCard
        featured
        className="relative overflow-hidden p-6 sm:p-8"
      >
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
                      <Stethoscope className="h-3.5 w-3.5" /> Professional
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {hasNoEntities ? (
            <div className="flex flex-col gap-2 sm:items-end">
              <p className="text-xs font-medium text-muted-foreground">How would you like to get started?</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="gap-2 shadow-pop">
                  <Link href="/dashboard/register?type=business">
                    <Building2 className="h-4 w-4" aria-hidden />
                    Register a Business
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="gap-2">
                  <Link href="/dashboard/register?type=professional">
                    <Stethoscope className="h-4 w-4" aria-hidden />
                    I'm a Professional
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <Button asChild size="sm" className="shrink-0 gap-2 self-start shadow-pop sm:self-auto">
              <Link href={business?.slug ? `/business/${business.slug}` : professional?.slug ? `/p/${professional.slug}` : '/dashboard/register'}>
                {business?.slug ? 'View your business' : 'View your professional page'}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          )}
        </div>
      </SectionCard>
    </MotionFadeUp>
  );
}
