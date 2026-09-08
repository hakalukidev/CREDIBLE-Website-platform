'use client';

import { useState } from 'react';
import { Building2, Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileForm } from '@/features/business/profile-form';
import { ProfessionalProfileForm } from '@/features/professional/professional-profile-form';
import { useSession } from '@/lib/store/session';
import { duration, easeOut } from '@/lib/animations';
import { cn } from '@/lib/utils';

type Choice = 'business' | 'professional' | null;

export function AccountBusinessContent() {
  const session = useSession((s) => s.session);
  const [choice, setChoice] = useState<Choice>(null);

  const role = session?.user.role;
  if (role === 'BUSINESS') return <ProfileForm />;
  if (role === 'PROFESSIONAL') return <ProfessionalProfileForm />;
  if (choice === 'business') return <ProfileForm />;
  if (choice === 'professional') return <ProfessionalProfileForm />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register your business or professional page</CardTitle>
        <CardDescription>
          Pick which kind of page you'd like to create. You can only own one
          of each — once you've made a business you can't also create a
          professional one (and vice-versa).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {CHOICES.map((choice) => (
            <ChoiceCard
              key={choice.id}
              icon={<choice.icon className="h-6 w-6" />}
              title={choice.title}
              subtitle={choice.subtitle}
              perks={choice.perks}
              onSelect={() => setChoice(choice.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const CHOICES: Array<{
  id: Exclude<Choice, null>;
  icon: typeof Building2;
  title: string;
  subtitle: string;
  perks: string[];
}> = [
  {
    id: 'business',
    icon: Building2,
    title: "I'm a business",
    subtitle: 'Restaurants, shops, agencies, clinics — any registered entity.',
    perks: [
      'Public business page with QR code',
      'Respond to reviews',
      'Apply for the Credible Verified badge',
    ],
  },
  {
    id: 'professional',
    icon: Briefcase,
    title: "I'm a professional",
    subtitle:
      'Doctors, lawyers, consultants, freelancers — anyone serving clients under their own name.',
    perks: [
      'Personal profile with specialties',
      'Collect reviews from clients',
      'Showcase experience & languages',
    ],
  },
];

interface ChoiceCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  perks: string[];
  onSelect: () => void;
}

function ChoiceCard({ icon, title, subtitle, perks, onSelect }: ChoiceCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: duration.fast, ease: easeOut }}
      className={cn(
        'group relative w-full overflow-hidden rounded-xl border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md',
        'border-border hover:border-primary/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
      )}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          {icon}
        </span>
        <div>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5">
        {perks.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>{p}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </motion.button>
  );
}

// Skeleton re-exported so the dynamic loader in account-shell can
// render a sensible placeholder while the chunk is in flight.
export function AccountBusinessSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}
