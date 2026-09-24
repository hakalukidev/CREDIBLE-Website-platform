'use client';

import { motion } from 'framer-motion';
import {
  UserCheck,
  Search,
  ShieldAlert,
  Activity,
  Flag,
} from 'lucide-react';
import { MotionSection } from '@/components/ui/motion-primitives';

const LAYERS = [
  {
    icon: UserCheck,
    title: 'Real reviewer verification',
    body: 'We use account and contact verification to make it harder for fake or automated accounts to submit reviews.',
  },
  {
    icon: Search,
    title: 'Review authenticity checks',
    body: 'Our system analyzes reviews and account activity for patterns associated with spam, fake reviews, duplicate submissions, and manipulation.',
  },
  {
    icon: ShieldAlert,
    title: 'Duplicate & abuse protection',
    body: 'We monitor repeated activity and attempts to influence ratings through multiple accounts or coordinated submissions.',
  },
  {
    icon: Activity,
    title: 'Suspicious activity detection',
    body: 'Unusual review patterns, sudden activity, and other risk signals can trigger additional checks or moderation.',
  },
  {
    icon: Flag,
    title: 'Community reporting',
    body: 'Users and businesses can report reviews they believe violate our review guidelines.',
  },
];

export function ProtectionLayers() {
  return (
    <MotionSection className="relative overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-gold/[0.06]"
      />

      <div className="container-wide relative py-14 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            How we protect reviews
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Our protection layers
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            We use multiple layers of verification and protection to help ensure reviews come
            from real people and reflect genuine experiences.
          </p>
        </div>

        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
          }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {LAYERS.map(({ icon: Icon, title, body }) => (
            <motion.li
              key={title}
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
              }}
              className="group relative h-full rounded-2xl border border-border/70 bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-pop"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-brand-100/40 text-primary ring-1 ring-primary/15 transition-shadow group-hover:shadow-glow">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </MotionSection>
  );
}
