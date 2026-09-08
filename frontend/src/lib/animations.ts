// lib/animations.ts
//
// Shared Framer Motion variants for the auth + account surfaces.
//
// The whole goal is "subtle and professional, never flashy": keep durations
// under 250ms, never block interaction, and never animate anything that
// already has its own skeleton/loading state. If a new variant is needed
// it should be added here so all surfaces stay visually consistent.

import type { Variants, Transition } from 'framer-motion';

/**
 * Standard entrance — fades in and slides up a few pixels. Used for the
 * hero mark, headings, and form fields inside the auth card.
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Stagger container — orchestrates the entrance of children that use
 * the `fadeUp` variant. 60ms between siblings feels snappy without
 * making the page feel jittery.
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.05,
      staggerChildren: 0.06,
    },
  },
};

/**
 * Crossfade used inside AnimatePresence so swapping tab content feels
 * like a smooth fade rather than a hard cut.
 */
export const tabCrossfade: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

/**
 * Standard durations + easings — pulled out so individual variants
 * stay declarative.
 */
export const easeOut: Transition['ease'] = [0.22, 1, 0.36, 1];

/**
 * Standard duration tokens in seconds (Framer Motion takes seconds).
 */
export const duration = {
  fast: 0.18,
  base: 0.22,
  slow: 0.32,
} as const;

/**
 * Hover/tap micro-interaction for buttons. Spring stiffness 300 / damping
 * 25 gives a weighty feel without a rubber-band overshoot.
 */
export const buttonSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
  mass: 0.6,
};

/**
 * Helper for common viewport-once entrance props.
 * `viewport={{ once: true, amount: 0.2 }}` + `initial="hidden"` +
 * `whileInView="visible"` is the cheapest way to do a tasteful scroll-in.
 */
export const viewportOnce = { once: true, amount: 0.2 } as const;

/**
 * Scroll-reveal preset — a slightly larger slide + fade used for page
 * sections. Set `initial="hidden" whileInView="visible"` and pass these
 * as `variants`.
 */
export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
};

/**
 * Cards / grids — fade + scale-in so a set of sibling cards feels like
 * it "settles" into place rather than sliding past each other.
 */
export const cardReveal: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: easeOut },
  },
};

/**
 * Stagger wrapper for grids of cards. Wrap the grid, then put each card
 * in a `<MotionCardReveal>` (or a `motion.div` using `cardReveal`).
 */
export const cardStagger: Variants = {
  hidden: {},
  visible: {
    transition: { delayChildren: 0.06, staggerChildren: 0.08 },
  },
};
