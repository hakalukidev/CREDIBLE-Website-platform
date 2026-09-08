'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useMotionValue } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  /** Optional suffix appended to the formatted number (e.g. "+", "%"). */
  suffix?: string;
  /** Animation duration in ms. Default 1200. */
  durationMs?: number;
  className?: string;
}

/**
 * Counts from 0 up to `value` once the element enters the viewport.
 * Skips the tween under `prefers-reduced-motion`.
 */
export function AnimatedCounter({
  value,
  suffix,
  durationMs = 1200,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState('0');
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!inView) return;
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      motionValue.set(value);
      setDisplay(formatNumber(value));
      return;
    }
    const controls = animate(motionValue, value, {
      duration: durationMs / 1000,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(formatNumber(Math.round(latest))),
    });
    return () => controls.stop();
  }, [inView, value, durationMs, motionValue]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ fontVariantNumeric: 'tabular-nums' }}
      aria-label={`${value}${suffix ?? ''}`}
    >
      {display}
      {suffix}
    </span>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return n.toLocaleString('en-US');
}
