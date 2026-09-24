'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, BadgeCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { MotionSection } from '@/components/ui/motion-primitives';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    icon: Search,
    label: 'Search',
    title: 'Find the business or professional.',
    body: 'Search by name, category, or location. Results are real listings — never sponsored placements.',
  },
  {
    icon: BadgeCheck,
    label: 'Verify',
    title: 'Look for the Credible Certified badge — backed by human document review.',
    body: 'A Certified badge means documents have been checked by our team. Real verification, not a vanity stamp.',
  },
  {
    icon: CheckCircle2,
    label: 'Decide',
    title: 'Read real reviews. Make a confident choice.',
    body: 'Every review is OTP-verified, so what you read comes from people who actually used the service.',
  },
];

function StepIcon({ index }: { index: number }) {
  return (
    <span className="font-display text-xs font-bold tabular-nums tracking-wider text-muted-foreground">
      Step {String(index + 1).padStart(2, '0')}
    </span>
  );
}

export function HowItWorks() {
  return (
    <MotionSection className="border-y border-border/60 bg-gradient-to-b from-background to-muted/30">
      <div className="container-wide py-12 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            How it works
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Three steps to a smarter choice.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            From a simple search to a confident decision — every step on Credible is designed to be clear.
          </p>
        </div>

        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
          }}
          className="mt-10 grid gap-4 md:grid-cols-3"
        >
          {STEPS.map(({ icon: Icon, label, title, body }, idx) => (
            <motion.li
              key={label}
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
              }}
              className="group relative h-full rounded-2xl border border-border/70 bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop"
            >
              <StepIcon index={idx} />
              <span className="mt-4 ml-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-brand-100/40 text-primary ring-1 ring-primary/15 transition-shadow group-hover:shadow-glow">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <p className="mt-4 font-display text-base font-semibold text-foreground">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </motion.li>
          ))}
        </motion.ol>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="group h-11 rounded-full px-6 shadow-sm">
            <Link href={'/browse' as never}>
              Start exploring
              <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-11 rounded-full px-6">
            <Link href={'/guidelines' as never}>Read our review guidelines</Link>
          </Button>
        </div>
      </div>
    </MotionSection>
  );
}
