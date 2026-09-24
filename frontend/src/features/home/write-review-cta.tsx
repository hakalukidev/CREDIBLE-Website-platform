'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MotionSection } from '@/components/ui/motion-primitives';
import { cn } from '@/lib/utils';

interface WriteReviewCTAProps {
  /** When "business", use the alternate variant copy that targets business owners. */
  variant?: 'public' | 'business';
}

const COPY = {
  public: {
    eyebrow: 'Write a review',
    headline: 'Your experience matters.',
    highlight: 'Help others choose better.',
    body: 'Had a great experience with a business or professional? Tell others about it. Your honest review helps people make informed decisions and helps trustworthy businesses build a credible reputation.',
    cta: 'Write a review',
  },
  business: {
    eyebrow: 'Write a review',
    headline: 'Share your experience,',
    highlight: 'help others choose the best.',
    body: 'Found a service that exceeded expectations? Let everyone know. Your OTP-verified review helps hard-working businesses earn the recognition they deserve, and helps the best in every category rise to the top.',
    cta: 'Write a review',
  },
} as const;

export function WriteReviewCTA({ variant = 'public' }: WriteReviewCTAProps) {
  const copy = COPY[variant];

  return (
    <MotionSection
      className={cn(
        'relative overflow-hidden border-y border-border/60',
        variant === 'business' ? 'bg-gold-grad' : 'bg-light-hero',
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]"
      />

      <div className="container-wide relative grid items-center gap-10 py-14 md:py-20 md:grid-cols-[1.05fr_1fr]">
        <div>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold',
              variant === 'business'
                ? 'border border-gold-300 bg-white/80 text-gold-700'
                : 'border border-primary/20 bg-primary/5 text-primary',
            )}
          >
            <PenLine className="h-3 w-3" aria-hidden />
            {copy.eyebrow}
          </span>

          <h2 className="mt-4 font-display text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl">
            {copy.headline}{' '}
            <span className="bg-gradient-to-r from-primary via-brand-500 to-gold-600 bg-clip-text text-transparent">
              {copy.highlight}
            </span>
          </h2>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            {copy.body}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="group h-12 rounded-full px-7 text-[15px] shadow-md shadow-primary/25"
            >
              <Link href={'/submit-review' as never}>
                {copy.cta}
                <motion.span
                  aria-hidden
                  className="ml-1.5 inline-flex"
                  initial={{ x: 0 }}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full px-7"
            >
              <Link href={'/guidelines' as never}>How reviews work</Link>
            </Button>
          </div>
        </div>

        {/* Decorative illustration — a stylised review card */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="relative rounded-3xl border border-border bg-card p-6 shadow-lift">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-brand-100 text-primary ring-1 ring-primary/15">
                <PenLine className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-foreground">Your review</p>
                <p className="text-[11px] text-muted-foreground">OTP-verified · Public</p>
              </div>
            </div>
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="h-2.5 w-2.5 rounded-full bg-gold-500"
                    aria-hidden
                  />
                ))}
              </div>
              <div className="h-2 w-full rounded-full bg-muted" />
              <div className="h-2 w-5/6 rounded-full bg-muted/70" />
              <div className="h-2 w-2/3 rounded-full bg-muted/50" />
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl border border-success/25 bg-success/10 px-3 py-2 text-xs font-medium text-success">
              <span>OTP sent to your phone</span>
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-success/30">✓</span>
            </div>
          </div>
          <div
            aria-hidden
            className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-gold-100 blur-2xl"
          />
        </motion.div>
      </div>
    </MotionSection>
  );
}
