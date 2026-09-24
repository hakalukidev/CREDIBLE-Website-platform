'use client';

import {
  UserCheck,
  PhoneCall,
  ShieldCheck,
  Heart,
} from 'lucide-react';
import { MotionSection, MotionCardStagger, MotionCardReveal } from '@/components/ui/motion-primitives';

const POINTS = [
  {
    icon: PhoneCall,
    title: 'Verified by phone',
    body: 'One OTP per real person. Every review.',
  },
  {
    icon: UserCheck,
    title: 'Reviewed by humans',
    body: 'Our team reads every flagged review end-to-end.',
  },
  {
    icon: ShieldCheck,
    title: 'No paid rankings',
    body: 'You can’t buy position. You earn it.',
  },
  {
    icon: Heart,
    title: 'Open & transparent',
    body: 'Guidelines public. Disputes public. Trust public.',
  },
];

export function WhyCredible() {
  return (
    <MotionSection className="border-y border-border/60 bg-gradient-to-b from-background to-muted/30">
      <div className="container-wide py-12 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Why Credible
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built on the four things reviews usually skip.
          </h2>
        </div>

        <MotionCardStagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <MotionCardReveal key={title}>
              <div className="group h-full rounded-2xl border border-border/70 bg-card/80 p-5 shadow-card backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-gold-100 text-primary ring-1 ring-primary/15 transition-shadow group-hover:shadow-glow">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </MotionCardReveal>
          ))}
        </MotionCardStagger>
      </div>
    </MotionSection>
  );
}
