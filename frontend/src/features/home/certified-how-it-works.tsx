'use client';

import { motion } from 'framer-motion';
import { FileSignature, UploadCloud, ClipboardCheck, BadgeCheck } from 'lucide-react';
import { MotionSection } from '@/components/ui/motion-primitives';

const STEPS = [
  {
    icon: FileSignature,
    title: 'Apply',
    body: 'Create your Credible profile, select your business or professional category, and start the certification application.',
  },
  {
    icon: UploadCloud,
    title: 'Submit Evidence',
    body: 'Complete the assessment and provide the required policies, documents, licences, procedures, and supporting evidence.',
  },
  {
    icon: ClipboardCheck,
    title: 'Get Assessed',
    body: 'Credible reviews the submitted information against our published certification criteria and may request additional evidence.',
  },
  {
    icon: BadgeCheck,
    title: 'Get Certified Badge',
    body: 'Once the requirements are met, receive Credible Certified status, a public certification record, and a badge for your website.',
  },
];

export function CertifiedHowItWorks() {
  return (
    <MotionSection className="relative overflow-hidden border-y border-border/60 bg-gradient-to-b from-background to-muted/30">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.06),transparent)]"
      />

      <div className="container-wide relative py-14 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Credible Certified Badge
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Four steps from application to a publicly verifiable Certified badge — with a real human reading every submission.
          </p>
        </div>

        <motion.ol
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
          }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {STEPS.map(({ icon: Icon, title, body }, idx) => (
            <motion.li
              key={title}
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
              }}
              className="group relative h-full rounded-2xl border border-border/70 bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-gold-100 text-primary ring-1 ring-primary/15 transition-shadow group-hover:shadow-glow">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-display text-xs font-bold tabular-nums tracking-wider text-muted-foreground">
                  Step {String(idx + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </MotionSection>
  );
}
