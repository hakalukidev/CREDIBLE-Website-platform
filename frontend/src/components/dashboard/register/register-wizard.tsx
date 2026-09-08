'use client';

/**
 * Step 1: pick a kind. Step 2: complete the existing ProfileForm /
 * ProfessionalProfileForm. The two real forms already handle draft /
 * edit / category / image-upload / hours, so we never reimplement them
 * (would drift with the rest of the app).
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SectionCard } from '@/components/dashboard/primitives/section-card';
import { ChoiceStep, type RegisterKind } from './choice-step';
import { ProfileForm } from '@/features/business/profile-form';
import { ProfessionalProfileForm } from '@/features/professional/professional-profile-form';
import { useSession } from '@/lib/store/session';
import { apiClient, isNotFound } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { duration, easeOut } from '@/lib/animations';
import type { UserRole } from '@credible/types';

type WizardStep = 'choice' | 'details';

const STEP_TRANSITION = { duration: duration.base, ease: easeOut } as const;
const TOTAL_STEPS = 2;

interface OwnedEntity {
  id: string;
  slug?: string;
  displayName?: string;
}

function chooseKind(rawType: string | null): RegisterKind | null {
  return rawType === 'business' || rawType === 'professional' ? rawType : null;
}

export function RegisterWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession((s) => s.session);
  const qc = useQueryClient();

  const initialKind = chooseKind(searchParams.get('type'));
  const [kind, setKind] = useState<RegisterKind | null>(initialKind);
  const [step, setStep] = useState<WizardStep>(initialKind ? 'details' : 'choice');

  function pickKind(next: RegisterKind) {
    setKind(next);
    setStep('details');
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', next);
    router.replace(`/dashboard/register?${params.toString()}` as never, {
      scroll: false,
    });
  }

  function goBack() {
    setStep('choice');
  }

  // Only fetch the entity matching the chosen kind — the wizard shows
  // exactly one form at a time, so checking the other is wasteful.
  const { data: existingBiz } = useQuery<OwnedEntity | null>({
    queryKey: qk.businesses.me(),
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ success: true; data: OwnedEntity }>(
          '/businesses/me/profile',
        );
        return res.data.data;
      } catch (err) {
        if (isNotFound(err)) return null;
        throw err;
      }
    },
    enabled: step === 'details' && kind === 'business',
  });

  const { data: existingProf } = useQuery<OwnedEntity | null>({
    queryKey: qk.professionals.me(),
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ success: true; data: OwnedEntity }>(
          '/professionals/me/profile',
        );
        return res.data.data;
      } catch (err) {
        if (isNotFound(err)) return null;
        throw err;
      }
    },
    enabled: step === 'details' && kind === 'professional',
  });

  const stepIndex = step === 'choice' ? 0 : 1;
  const progress = Math.round(((stepIndex + 1) / TOTAL_STEPS) * 100);
  const sessionRole = session?.user.role as UserRole | undefined;
  const roleMismatch =
    (kind === 'business' && sessionRole === 'PROFESSIONAL') ||
    (kind === 'professional' && sessionRole === 'BUSINESS');

  function finish() {
    // Refresh the dashboard's owned-entity list, then return to it.
    qc.invalidateQueries({ queryKey: qk.businesses.me() });
    qc.invalidateQueries({ queryKey: qk.professionals.me() });
    router.push('/dashboard/businesses' as never);
  }

  return (
    <div className="space-y-6">
      <SectionCard className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Register a page
            </p>
            <p className="text-xs text-muted-foreground">
              Step {stepIndex + 1} of {TOTAL_STEPS}
            </p>
          </div>
          <Progress value={progress} aria-label="Registration progress" />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <StepPill active={step === 'choice'} done={step === 'details'}>1. Choose</StepPill>
            <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
            <StepPill
              active={step === 'details'}
              done={!!(existingBiz || existingProf)}
            >
              2. Fill in details
            </StepPill>
          </div>
        </div>
      </SectionCard>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={STEP_TRANSITION}
        >
          {step === 'choice' && <ChoiceStep value={kind} onChange={pickKind} />}

          {step === 'details' && (
            <div className="space-y-4">
              {roleMismatch && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <p className="font-semibold text-destructive">
                    Heads up — your account is already a {sessionRole?.toLowerCase()}.
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    You can only own one kind of page on Credible. Pick a different
                    kind or{' '}
                    <Link
                      href={'/dashboard/businesses' as never}
                      className="font-medium text-primary hover:underline"
                    >
                      manage your existing page
                    </Link>
                    .
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="ghost" size="sm" onClick={goBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button asChild size="sm" variant="outline" className="gap-2">
                  <Link href={'/dashboard/businesses' as never}>Cancel & return</Link>
                </Button>
              </div>

              <SectionCard className="p-6">
                {kind === 'business' && <ProfileForm />}
                {kind === 'professional' && <ProfessionalProfileForm />}
                {!kind && (
                  <p className="text-sm text-muted-foreground">
                    Pick a page type to continue.
                  </p>
                )}
              </SectionCard>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={finish}
                >
                  Done
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

interface StepPillProps {
  active: boolean;
  done: boolean;
  children: React.ReactNode;
}

function StepPill({ active, done, children }: StepPillProps) {
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ' +
        (active
          ? 'bg-primary text-primary-foreground'
          : done
            ? 'bg-success/15 text-success'
            : 'bg-muted text-muted-foreground')
      }
    >
      {active ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : done ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : null}
      {children}
    </span>
  );
}
