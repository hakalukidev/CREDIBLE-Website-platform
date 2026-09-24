'use client';

import * as React from 'react';
import { motion, useInView } from 'framer-motion';
import {
  PenLine,
  PhoneCall,
  Bot,
  Users,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { MotionSection } from '@/components/ui/motion-primitives';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  icon: typeof PenLine;
  body: string;
}

const STEPS: Step[] = [
  { id: 'submit', label: 'Submit', icon: PenLine, body: 'Real customer leaves a review.' },
  { id: 'otp', label: 'OTP Verify', icon: PhoneCall, body: 'One-time code sent by SMS.' },
  { id: 'ai', label: 'AI Check', icon: Bot, body: 'Signals scanned for spam & abuse.' },
  { id: 'human', label: 'Human Moderation', icon: Users, body: 'A real person signs off.' },
  { id: 'published', label: 'Published', icon: CheckCircle2, body: 'Review goes live with timestamp.' },
  { id: 'badge', label: 'Badge Issued', icon: Award, body: 'Business earns its verified mark.' },
];

/**
 * Sequential reveal of the review journey. When the section enters the
 * viewport, each node lights up one after another (spring easing) and the
 * SVG connector line draws to the active node.
 */
export function AuthenticReviewFlow() {
  const sectionRef = React.useRef<HTMLDivElement | null>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.25 });
  const [activeIdx, setActiveIdx] = React.useState(-1);

  React.useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    const run = async () => {
      for (let i = 0; i < STEPS.length; i++) {
        if (cancelled) return;
        setActiveIdx(i);
        await new Promise((r) => setTimeout(r, 320));
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [inView]);

  const progress = activeIdx >= 0 ? (activeIdx + 1) / STEPS.length : 0;

  return (
    <MotionSection className="relative overflow-hidden bg-background">
      {/* Soft gradient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-gold/[0.06]"
      />

      <div ref={sectionRef} className="container-wide py-14 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            How we secure authentic reviews
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Six steps. One trusted review.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            From the moment a review is written to the moment a badge is issued — every step is observable.
          </p>
        </div>

        <div className="relative mt-14">
          {/* Connector line — desktop horizontal */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-12 hidden h-px md:block"
          >
            <div className="relative h-full w-full overflow-hidden">
              <div className="absolute inset-0 bg-border/60" />
              <motion.div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary via-brand-500 to-gold-500"
                initial={{ width: '0%' }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          <ol className="grid grid-cols-2 gap-y-10 md:grid-cols-6 md:gap-y-0">
            {STEPS.map((step, idx) => {
              const isActive = idx <= activeIdx;
              const Icon = step.icon;
              return (
                <li
                  key={step.id}
                  className="relative flex flex-col items-center text-center"
                >
                  {/* Connector — mobile vertical */}
                  {idx > 0 && (
                    <div
                      aria-hidden
                      className="absolute left-1/2 top-[-2.5rem] h-10 w-px -translate-x-1/2 bg-border md:hidden"
                    >
                      <motion.div
                        className="h-full w-full bg-gradient-to-b from-primary to-gold-500"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: idx <= activeIdx ? 1 : 0 }}
                        style={{ transformOrigin: 'top' }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  )}

                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive ? 1 : 0.95,
                      opacity: isActive ? 1 : 0.55,
                    }}
                    transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                    className={cn(
                      'relative z-10 flex h-24 w-24 items-center justify-center rounded-full border-2 bg-card shadow-card transition-shadow',
                      isActive
                        ? 'border-primary/60 shadow-glow'
                        : 'border-border',
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-7 w-7 transition-colors',
                        isActive ? 'text-primary' : 'text-muted-foreground',
                      )}
                      aria-hidden
                    />
                    {isActive && (
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 -z-10 rounded-full ring-4 ring-primary/15"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                      />
                    )}
                  </motion.div>

                  <p
                    className={cn(
                      'mt-4 font-display text-sm font-semibold tracking-tight transition-colors',
                      isActive ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    <span className="mr-1 inline-block tabular-nums text-[10px] font-bold uppercase tracking-wider text-primary">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {step.label}
                  </p>
                  <p className="mt-1 max-w-[10rem] text-xs leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </MotionSection>
  );
}
