'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { CredibleSearch } from '@/components/layout/credible-search';
import { Button } from '@/components/ui/button';
import { MotionFadeUp } from '@/components/ui/motion-primitives';

const TRUST_INDICATORS = [
  { label: 'Free for the public' },
  { label: 'No paid rankings' },
  { label: 'OTP-verified reviews' },
];

/**
 * Hero — tagline-first. Headline is the single most important sentence on the
 * site; trust indicators sit underneath it as quiet chips. Search sits at the
 * centre as the dominant interaction.
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-light-hero">
      {/* Subtle radial accents — kept faint so the surface stays light/airy */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-[-10%] h-[480px] w-[480px] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl" />
        <div className="absolute top-1/3 left-[-8%] h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-gold/10 to-transparent blur-3xl" />
      </div>

      <div className="container-wide relative grid items-center gap-12 py-14 md:py-20 lg:py-24">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <MotionFadeUp delay={0.04}>
            <h1 className="font-display text-[clamp(1.85rem,1.1rem+3.2vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-foreground">
              Credible helps you{' '}
              <span className="bg-gradient-to-r from-primary via-brand-500 to-gold-600 bg-clip-text text-transparent">
                discover, review, and verify
              </span>{' '}
            </h1>
          </MotionFadeUp>

          <MotionFadeUp delay={0.12}>
            <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground sm:gap-x-7">
              {TRUST_INDICATORS.map((item) => (
                <li key={item.label} className="inline-flex items-center gap-1.5">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                  <span className="font-medium text-foreground/80">{item.label}</span>
                </li>
              ))}
            </ul>
          </MotionFadeUp>

          <MotionFadeUp delay={0.2} className="mt-7 w-full">
            <CredibleSearch />
          </MotionFadeUp>

          <MotionFadeUp delay={0.28} className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="group h-11 rounded-full px-5 shadow-sm">
              <Link href={'/submit-review' as never}>
                Write a review
                <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 rounded-full px-5">
              <Link href={'/browse' as never}>Browse businesses</Link>
            </Button>
          </MotionFadeUp>
        </div>

        {/* Soft glow under the search to ground it visually */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[58%] -z-10 h-48 w-3/4 -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/15 to-transparent blur-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
        />
      </div>
    </section>
  );
}
