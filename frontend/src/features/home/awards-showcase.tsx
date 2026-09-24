'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Trophy, Award as AwardIcon, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MotionSection } from '@/components/ui/motion-primitives';

interface FeaturedWinner {
  id: string;
  category: string;
  name: string;
  year: number;
  description: string;
  hue: string;
}

const WINNERS: FeaturedWinner[] = [
  {
    id: '1',
    category: 'Best in Banking',
    name: 'Zenith Bank',
    year: 2026,
    description: 'Recognised for outstanding customer trust scores.',
    hue: 'from-primary/15 to-brand-100',
  },
  {
    id: '2',
    category: 'Best in IT',
    name: 'Helix Cloud',
    year: 2026,
    description: 'Top-rated verified reviews across cloud & SaaS.',
    hue: 'from-gold-200 to-gold-50',
  },
  {
    id: '3',
    category: 'Best in Restaurant',
    name: 'Saffron & Stone',
    year: 2026,
    description: 'Most loved dining experience in the Credible community.',
    hue: 'from-brand-200/60 to-gold-100',
  },
];

/**
 * Cinematic reveal of featured awards — staggered scroll-reveal of three
 * winners plus an embedded "Watch the ceremony" video placeholder. The
 * play button is decorative: when the client supplies a real video URL,
 * wire the button to open it.
 */
export function AwardsShowcase() {
  return (
    <MotionSection className="relative overflow-hidden border-y border-border/60 bg-gold-grad">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]" />

      <div className="container-wide relative py-14 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-300 bg-white/80 px-3.5 py-1 text-xs font-semibold text-gold-700">
            <Trophy className="h-3 w-3" />
            Credible Awards
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Celebrating excellence.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Every cycle, the businesses and professionals with the highest verified-trust scores take home a Credible Award.
          </p>
        </div>

        {/* Featured winners — cinematic reveal */}
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {WINNERS.map((w, i) => (
            <motion.li
              key={w.id}
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden rounded-2xl border border-gold-200/80 bg-card p-5 shadow-card transition-shadow hover:shadow-ring-gold"
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br ${w.hue} blur-2xl opacity-70 transition-opacity group-hover:opacity-100`}
              />

              <div className="relative flex items-start gap-4">
                <AwardBadge className="h-14 w-14 shrink-0 animate-badge-reveal" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-700">
                    {w.category}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-foreground">
                    {w.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{w.description}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold-700">
                    <Sparkles className="h-3 w-3" />
                    {w.year} Winner
                  </p>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>

        {/* Ceremony video block */}
        <div className="mt-14">
          <div className="group relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-lift">
            <div
              aria-hidden
              className="relative aspect-video w-full bg-gradient-to-br from-primary/15 via-brand-200/30 to-gold/30"
            >
              {/* Subtle radial glow */}
              <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,white,transparent_70%)] opacity-40" />

              {/* Play overlay */}
              <button
                type="button"
                aria-label="Play the Credible Awards ceremony"
                className="absolute inset-0 flex items-center justify-center"
                onClick={() => {
                  // Client-provided video will be wired here.
                }}
              >
                <span className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-foreground shadow-pop transition-transform group-hover:scale-105 sm:h-24 sm:w-24">
                  <span aria-hidden className="absolute inset-0 -z-10 rounded-full bg-white/40 blur-xl" />
                  <Play className="h-7 w-7 fill-current sm:h-9 sm:w-9" />
                </span>
              </button>

              {/* Caption */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/40 to-transparent p-5 text-white">
                <div>
                  <p className="font-display text-sm font-semibold sm:text-base">
                    Credible Awards — Celebrating Excellence
                  </p>
                  <p className="mt-0.5 text-xs text-white/80">
                    Ceremony highlights · 2:14
                  </p>
                </div>
                <AwardIcon className="h-7 w-7 text-gold-300" aria-hidden />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" className="h-11 rounded-full bg-gold px-6 text-gold-foreground shadow-ring-gold hover:bg-gold/90">
              <Link href="/awards">
                See all winners
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </MotionSection>
  );
}

/** Inline SVG of the Credible award medal — gold gradient with shine sweep. */
function AwardBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <defs>
        <linearGradient id="credAwardBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(43 96% 60%)" />
          <stop offset="100%" stopColor="hsl(35 92% 44%)" />
        </linearGradient>
        <linearGradient id="credAwardShine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="50%" stopColor="white" stopOpacity="0.85" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <clipPath id="credAwardClip">
          <circle cx="32" cy="28" r="18" />
        </clipPath>
      </defs>
      {/* Ribbon */}
      <path d="M22 40l-6 18 12-6 4 6 4-6 12 6-6-18" fill="hsl(35 92% 44%)" />
      {/* Medal */}
      <circle cx="32" cy="28" r="18" fill="url(#credAwardBody)" stroke="hsl(35 80% 24%)" strokeWidth="1.5" />
      {/* Star */}
      <path
        d="M32 18l2.6 5.5 6 .9-4.4 4.3 1 6-5.2-2.8-5.2 2.8 1-6L23.4 24.4l6-.9z"
        fill="white"
      />
      {/* Shine */}
      <g clipPath="url(#credAwardClip)">
        <rect x="0" y="0" width="64" height="56" fill="url(#credAwardShine)" className="animate-shine" />
      </g>
    </svg>
  );
}
