'use client';

/**
 * ChoiceStep — first step of the Register wizard. Lets the user pick
 * between "I'm a business" and "I'm a professional". Mirrors the
 * existing `ChoiceCard` from `/account/business` so the design stays
 * consistent, but without the "edit-existing" branching — this wizard
 * is only used for *new* registrations.
 */

import { motion } from 'framer-motion';
import { ArrowRight, Building2, CheckCircle2, Stethoscope } from 'lucide-react';
import { duration, easeOut } from '@/lib/animations';
import { cn } from '@/lib/utils';

export type RegisterKind = 'business' | 'professional';

interface ChoiceCardProps {
  id: RegisterKind;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  perks: string[];
  selected: boolean;
  onSelect: (id: RegisterKind) => void;
}

function ChoiceCard({
  id,
  icon: Icon,
  title,
  subtitle,
  perks,
  selected,
  onSelect,
}: ChoiceCardProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(id)}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: duration.fast, ease: easeOut }}
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl border bg-card p-6 text-left shadow-card transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected
          ? 'border-primary/50 ring-2 ring-primary/30'
          : 'border-border/70 hover:border-primary/40 hover:shadow-pop',
      )}
    >
      {/* Soft gradient overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent"
      />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
              selected
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/10 text-primary group-hover:bg-primary/15',
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <ul className="mt-4 space-y-1.5">
          {perks.map((p) => (
            <li
              key={p}
              className="flex items-start gap-2 text-sm text-foreground"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>{p}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          {selected ? 'Selected' : 'Choose this'}{' '}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </motion.button>
  );
}

interface ChoiceStepProps {
  value: RegisterKind | null;
  onChange: (kind: RegisterKind) => void;
}

export function ChoiceStep({ value, onChange }: ChoiceStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Step 1 of 2
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          What kind of page would you like to register?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick one to start. You can only own one of each on Credible, but
          you can always come back and edit it later.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChoiceCard
          id="business"
          icon={Building2}
          title="I'm a business"
          subtitle="Restaurants, shops, agencies, clinics — any registered entity."
          perks={[
            'Public business page with QR code',
            'Respond to reviews',
            'Apply for the Credible Verified badge',
          ]}
          selected={value === 'business'}
          onSelect={onChange}
        />
        <ChoiceCard
          id="professional"
          icon={Stethoscope}
          title="I'm a professional"
          subtitle="Doctors, lawyers, consultants, freelancers — anyone serving clients under their own name."
          perks={[
            'Personal profile with specialties',
            'Collect reviews from clients',
            'Showcase experience & languages',
          ]}
          selected={value === 'professional'}
          onSelect={onChange}
        />
      </div>
    </div>
  );
}
