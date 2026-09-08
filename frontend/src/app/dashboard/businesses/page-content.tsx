'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  ExternalLink,
  PencilLine,
  PlusCircle,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient, isNotFound } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/dashboard/primitives/empty-state';
import { SectionCard } from '@/components/dashboard/primitives/section-card';
import { PageHeader } from '@/components/dashboard/page-header';
import { duration, easeOut } from '@/lib/animations';
import type { BusinessStatus, VerificationStatus } from '@credible/types';

interface BusinessEntity {
  id: string;
  slug: string;
  displayName: string;
  legalName?: string | null;
  status: string;
  verificationStatus?: string;
  city?: string | null;
  state?: string | null;
  logo?: string | null;
  ratingAverage?: number | null;
  ratingCount?: number;
}

const STATUS_VARIANTS: Record<
  string,
  { label: string; tone: 'success' | 'secondary' | 'muted' | 'destructive' }
> = {
  PUBLISHED: { label: 'Live', tone: 'success' },
  PENDING: { label: 'Pending', tone: 'secondary' },
  DRAFT: { label: 'Draft', tone: 'muted' },
  SUSPENDED: { label: 'Suspended', tone: 'destructive' },
  CLOSED: { label: 'Closed', tone: 'muted' },
};

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
} as const;

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
} as const;

const STATUS_VARIANT_TO_BADGE: Record<
  'success' | 'secondary' | 'muted' | 'destructive',
  string
> = {
  success: 'bg-success/15 text-success ring-1 ring-success/20',
  secondary: 'bg-secondary/15 text-secondary-foreground ring-1 ring-secondary/20',
  muted: 'bg-muted text-muted-foreground ring-1 ring-border',
  destructive: 'bg-destructive/15 text-destructive ring-1 ring-destructive/20',
};

function StatusBadge({ status }: { status: string }) {
  const v = STATUS_VARIANTS[status] ?? {
    label: status,
    tone: 'muted' as const,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_VARIANT_TO_BADGE[v.tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {v.label}
    </span>
  );
}

function VerificationBadge({ status }: { status?: string }) {
  if (!status || status === 'NOT_STARTED') return null;
  if (status === 'APPROVED') {
    return (
      <Badge variant="success" className="gap-1">
        <ShieldCheck className="h-3.5 w-3.5" /> Verified
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <ShieldCheck className="h-3.5 w-3.5" /> {status.toLowerCase().replace(/_/g, ' ')}
    </Badge>
  );
}

interface EntityCardProps {
  entity: BusinessEntity;
  kind: 'business' | 'professional';
}

function EntityCard({ entity, kind }: EntityCardProps) {
  const Icon = kind === 'business' ? Building2 : Stethoscope;
  const editHref = kind === 'business' ? '/business/dashboard' : '/professional/dashboard';
  const viewHref =
    entity.status === (('PUBLISHED' as BusinessStatus))
      ? kind === 'business'
        ? `/business/${entity.slug}`
        : `/professionals/${entity.slug}`
      : null;
  const location = [entity.city, entity.state].filter(Boolean).join(', ');

  return (
    <SectionCard interactive className="h-full p-0">
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 ring-1 ring-border">
              {entity.logo && <AvatarImage src={entity.logo} alt={entity.displayName} />}
              <AvatarFallback className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent text-primary">
                <Icon className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">{entity.displayName}</CardTitle>
              {entity.legalName && entity.legalName !== entity.displayName && (
                <p className="truncate text-xs text-muted-foreground">{entity.legalName}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {location || 'Location not set'}
              </p>
            </div>
          </div>
          <StatusBadge status={entity.status} />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <VerificationBadge status={entity.verificationStatus as VerificationStatus | undefined} />
          {typeof entity.ratingAverage === 'number' && (entity.ratingCount ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 font-medium text-secondary-foreground">
              ★ {entity.ratingAverage.toFixed(1)}{' '}
              <span className="text-muted-foreground">({entity.ratingCount})</span>
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link href={editHref as never}>
              <PencilLine className="h-4 w-4" /> Edit
            </Link>
          </Button>
          {viewHref && (
            <Button asChild size="sm" className="gap-2">
              <Link href={viewHref as never}>
                <ExternalLink className="h-4 w-4" /> View page
              </Link>
            </Button>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

function InlineHintCard({
  title,
  body,
  ctaLabel,
  icon,
  href,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{body}</p>
        <Button asChild className="mt-3 gap-2" size="sm">
          <Link href={href as never}>
            <span className="inline-flex">{icon}</span>
            {ctaLabel}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function DashboardBusinessesContent() {
  const { data: business, isLoading: bizLoading } = useQuery<BusinessEntity | null>({
    queryKey: qk.businesses.me(),
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ success: true; data: BusinessEntity }>(
          '/businesses/me/profile',
        );
        return res.data.data;
      } catch (err) {
        if (isNotFound(err)) return null;
        throw err;
      }
    },
  });

  const { data: professional, isLoading: profLoading } = useQuery<BusinessEntity | null>({
    queryKey: qk.professionals.me(),
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ success: true; data: BusinessEntity }>(
          '/professionals/me/profile',
        );
        return res.data.data;
      } catch (err) {
        if (isNotFound(err)) return null;
        throw err;
      }
    },
  });

  const isLoading = bizLoading || profLoading;

  const hasBusiness = !!business;
  const hasProfessional = !!professional;
  const hasAny = useMemo(
    () => hasBusiness || hasProfessional,
    [hasBusiness, hasProfessional],
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your pages"
        title="Businesses & Professional Pages"
        description="Pages you own or manage on Credible. Edit the details, view your public profile, or track verification status."
        actions={
          hasAny ? (
            <Button asChild size="sm" className="gap-2">
              <Link href={'/dashboard/register' as never}>
                <PlusCircle className="h-4 w-4" /> Register another
              </Link>
            </Button>
          ) : undefined
        }
      />

      {!hasAny ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title="You haven't registered a page yet"
          description="Get a public page on Credible so customers can find you, leave reviews, and see your verification status."
          primaryAction={
            <Button asChild size="sm" className="gap-2">
              <Link href={'/dashboard/register?type=business' as never}>
                <Building2 className="h-4 w-4" /> Register a business
              </Link>
            </Button>
          }
          secondaryAction={
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link href={'/dashboard/register?type=professional' as never}>
                <Stethoscope className="h-4 w-4" /> Register a professional page
              </Link>
            </Button>
          }
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={CONTAINER_VARIANTS}
          className="grid gap-4 sm:grid-cols-2"
        >
          {business && (
            <motion.div variants={CARD_VARIANTS} transition={{ duration: duration.base, ease: easeOut }}>
              <EntityCard entity={business} kind="business" />
            </motion.div>
          )}
          {professional && (
            <motion.div variants={CARD_VARIANTS} transition={{ duration: duration.base, ease: easeOut }}>
              <EntityCard entity={professional} kind="professional" />
            </motion.div>
          )}
        </motion.div>
      )}

      {hasAny && !hasBusiness && (
        <InlineHintCard
          title="Add a business page"
          body="Bring your registered business onto Credible with a public profile, QR code, and review invites."
          ctaLabel="Register a business"
          href="/dashboard/register?type=business"
          icon={<PlusCircle className="h-4 w-4" />}
        />
      )}

      {hasAny && !hasProfessional && (
        <InlineHintCard
          title="Add a professional page"
          body="Showcase your services, specialties, and experience under your own name on Credible."
          ctaLabel="Register a professional page"
          href="/dashboard/register?type=professional"
          icon={<PlusCircle className="h-4 w-4" />}
        />
      )}
    </div>
  );
}
