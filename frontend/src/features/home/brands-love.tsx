'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Star, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MotionSection } from '@/components/ui/motion-primitives';

interface FloatingCard {
  id: string;
  name: string;
  initials: string;
  body: string;
  rating: number;
  business: string;
  position: { top: string; left: string };
  rotate: number;
  delay: number;
  hue: string;
}

const CARDS: FloatingCard[] = [
  {
    id: '1',
    name: 'Aria K.',
    initials: 'AK',
    body: '“Genuine reviews. No fluff.”',
    rating: 5,
    business: 'Helix Cloud',
    position: { top: '6%', left: '2%' },
    rotate: -6,
    delay: 0,
    hue: 'from-primary/15 to-gold-100',
  },
  {
    id: '2',
    name: 'Daniel R.',
    initials: 'DR',
    body: '“Our badge increased sign-ups.”',
    rating: 5,
    business: 'Zenith Bank',
    position: { top: '14%', left: '74%' },
    rotate: 5,
    delay: 0.2,
    hue: 'from-gold-200/80 to-primary/10',
  },
  {
    id: '3',
    name: 'Maya L.',
    initials: 'ML',
    body: '“The verification flow feels premium.”',
    rating: 4,
    business: 'Saffron & Stone',
    position: { top: '50%', left: '4%' },
    rotate: -3,
    delay: 0.4,
    hue: 'from-brand-200/60 to-gold-100',
  },
  {
    id: '4',
    name: 'Owen T.',
    initials: 'OT',
    body: '“A trust layer we always wanted.”',
    rating: 5,
    business: 'Pixel Forge',
    position: { top: '60%', left: '78%' },
    rotate: 4,
    delay: 0.6,
    hue: 'from-primary/10 to-brand-100',
  },
  {
    id: '5',
    name: 'Sara P.',
    initials: 'SP',
    body: '“Easy to verify, easier to trust.”',
    rating: 5,
    business: 'Mela Kitchen',
    position: { top: '76%', left: '20%' },
    rotate: -4,
    delay: 0.8,
    hue: 'from-gold-100 to-primary/10',
  },
];

/**
 * "Brands Love What We Do" — central device/illustration with floating review
 * cards drifting around it. Each card parallaxes with the cursor and floats
 * gently via CSS animations.
 */
export function BrandsLove() {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sX = useSpring(mouseX, { stiffness: 50, damping: 18 });
  const sY = useSpring(mouseY, { stiffness: 50, damping: 18 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mouseX.set(((e.clientX - cx) / rect.width) * 12);
    mouseY.set(((e.clientY - cy) / rect.height) * 12);
  };

  return (
    <MotionSection className="relative overflow-hidden bg-gradient-to-b from-muted/20 to-background">
      <div className="container-wide py-14 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Brands love what we do
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trusted by the businesses people come back to.
          </h2>
        </div>

        <div
          ref={ref}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            mouseX.set(0);
            mouseY.set(0);
          }}
          className="relative mx-auto mt-14 h-[420px] max-w-4xl md:h-[520px]"
        >
          {/* Center device illustration — placeholder laptop with badge */}
          <motion.div
            style={{ x: useTransform(sX, (v) => v * -1), y: useTransform(sY, (v) => v * -1) }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative h-44 w-72 rounded-2xl border border-border bg-card shadow-lift sm:h-56 sm:w-[22rem]">
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
                <span className="ml-2 h-4 w-32 rounded-md bg-muted" />
              </div>
              {/* Body — sample page with a badge */}
              <div className="space-y-3 p-4">
                <div className="h-3 w-2/3 rounded-full bg-muted" />
                <div className="h-3 w-1/2 rounded-full bg-muted/60" />
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-gold-200/70 bg-gold-grad px-3 py-2">
                  <AwardMark className="h-7 w-7" />
                  <div>
                    <p className="font-display text-[11px] font-semibold text-gold-700">Verified by Credible</p>
                    <p className="text-[10px] text-muted-foreground">Human-reviewed badge</p>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted/50" />
                <div className="h-2 w-3/4 rounded-full bg-muted/50" />
              </div>
            </div>
            <div className="mx-auto mt-1 h-2 w-3/4 rounded-b-xl bg-foreground/10" />
          </motion.div>

          {/* Floating testimonial cards */}
          {CARDS.map((card) => {
            const x = useTransform(sX, (v) => v * (1 + (card.rotate % 2 === 0 ? 0.5 : -0.3)));
            const y = useTransform(sY, (v) => v * (1 + (card.rotate % 2 === 0 ? -0.4 : 0.6)));
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.85, y: 12 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: card.delay, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  top: card.position.top,
                  left: card.position.left,
                  x,
                  y,
                  rotate: card.rotate,
                }}
                className="absolute z-10 hidden w-56 rounded-2xl border border-border bg-card p-4 shadow-pop sm:block"
              >
                <Quote className="h-4 w-4 text-gold-500/70" aria-hidden />
                <p className="mt-2 text-sm leading-relaxed text-foreground">{card.body}</p>
                <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-foreground ${card.hue}`}
                    aria-hidden
                  >
                    {card.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{card.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{card.business}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-2.5 w-2.5 ${i < card.rating ? 'fill-gold-500 text-gold-500' : 'fill-muted text-muted'}`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Mobile-only stacked cards */}
          <div className="absolute inset-x-0 bottom-0 grid grid-cols-2 gap-3 sm:hidden">
            {CARDS.slice(0, 4).map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-card p-3 shadow-card">
                <p className="text-xs leading-snug">{c.body}</p>
                <p className="mt-2 text-[10px] text-muted-foreground">{c.name} · {c.business}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" variant="outline" className="h-11 rounded-full px-6">
            <Link href="/contact">Book a demo</Link>
          </Button>
          <Button asChild size="lg" className="h-11 rounded-full px-6 shadow-sm">
            <Link href="/for-business">
              Get started
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </MotionSection>
  );
}

/** Small inline award badge used inside the device illustration. */
function AwardMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <defs>
        <linearGradient id="credAwardGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(43 96% 60%)" />
          <stop offset="100%" stopColor="hsl(35 92% 44%)" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="14" r="9" fill="url(#credAwardGrad)" stroke="hsl(35 80% 24%)" strokeWidth="1" />
      <path d="M11.5 14.5l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 21l-2 7 5-2-1.5-3.5M21 21l2 7-5-2 1.5-3.5" fill="hsl(35 92% 44%)" />
    </svg>
  );
}
