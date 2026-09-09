'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Smartphone,
  ShieldCheck,
  BadgeCheck,
  UserCheck,
  LockKeyhole,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

const STEPS = [
  {
    icon: Smartphone,
    title: 'Phone-verified reviewer',
    body: 'Every reviewer confirms a one-time password (OTP) to their phone before writing — so every review is tied to a real, reachable person.',
  },
  {
    icon: LockKeyhole,
    title: 'One review per person',
    body: 'Each person can review a business only once, and edit within 24 hours — preventing gaming, duplicates, and stacked reviews.',
  },
  {
    icon: UserCheck,
    title: 'Human document review',
    body: 'Badges are never auto-approved. A real human checks the submitted documents before a business earns the Credible Verified badge.',
  },
  {
    icon: BadgeCheck,
    title: 'Business can respond',
    body: 'Verified businesses reply publicly to reviews — so customer concerns are resolved transparently and publicly.',
  },
];

/**
 * "How Credible stays authentic" — an interactive, avast-style walkthrough.
 * Tabs through the security layers of the review system with animated steps.
 */
export function HowAuthentic() {
  const [active, setActive] = useState(0);

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
      {/* Step selector */}
      <div className="flex flex-col gap-3">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === active;
          return (
            <button
              key={step.title}
              type="button"
              onClick={() => setActive(idx)}
              aria-pressed={isActive}
              className={`group flex items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-300 ${
                isActive
                  ? 'border-primary/30 bg-card shadow-pop'
                  : 'border-transparent hover:border-border/60 hover:bg-muted/30'
              }`}
            >
              <span
                className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  isActive
                    ? 'bg-gradient-to-br from-brand-600 to-primary text-primary-foreground shadow-glow'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className={`block font-display font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">{step.body}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Animated visual */}
      <Card className="relative overflow-hidden rounded-3xl border-border/70 bg-card/90 p-8 shadow-card">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-success/15 blur-3xl"
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-success/20 to-primary/5 text-success ring-1 ring-success/20">
                <ShieldCheck className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-success">
                  Step {active + 1} of {STEPS.length}
                </p>
                <h3 className="font-display text-xl font-semibold">{STEPS[active].title}</h3>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {STEPS.slice(0, active + 1).map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.12 }}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden />
                  <span className="text-muted-foreground">{s.title}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-xl border border-success/25 bg-success/10 px-3 py-2.5 text-xs font-medium text-success">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Every layer is audited — this is why Credible reviews stay authentic.
            </div>
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  );
}
