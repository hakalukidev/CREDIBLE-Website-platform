// components/ui/motion-primitives.tsx
'use client';

/**
 * Tiny wrapper around framer-motion's `motion.div` that wires up the
 * shared variants from `@/lib/animations` so call sites don't need to
 * pass variants / initial / animate every time.
 *
 * Usage:
 *   <MotionFadeUp>...</MotionFadeUp>
 *   <MotionStagger>{children.map(...)}</MotionStagger>
 *   <MotionTabContent value="profile">...</MotionTabContent>
 *
 * Each component renders a plain `div` (with optional `as` prop via the
 * underlying motion library if needed later). Keeps the API minimal
 * while giving us a single place to tune the feel.
 */

import { motion, type HTMLMotionProps } from 'framer-motion';
import {
  fadeUp,
  staggerContainer,
  tabCrossfade,
  sectionReveal,
  cardReveal,
  cardStagger,
  duration,
  easeOut,
  viewportOnce,
} from '@/lib/animations';

interface MotionFadeUpProps extends HTMLMotionProps<'div'> {
  /** Extra delay in seconds (rarely needed — the stagger handles it). */
  delay?: number;
}

export function MotionFadeUp({
  initial = 'hidden',
  animate = 'visible',
  delay = 0,
  children,
  ...rest
}: MotionFadeUpProps) {
  // Framer Motion only applies named variants when `initial` / `animate`
  // are set (or inherited from a parent `motion.*` element with the same
  // labels). When `MotionFadeUp` is used standalone — e.g. in the
  // dashboard profile / account / auth screens — there is no such parent,
  // so without these defaults the element is stuck on the `hidden`
  // variant (`opacity: 0, y: 12`) and never shows.
  //
  // Callers that already wire the animation themselves (e.g. via a
  // parent `MotionStagger` that manages variant propagation) can still
  // pass `initial={false}` or custom values through `...rest` to opt
  // out of the defaults.
  return (
    <motion.div
      variants={fadeUp}
      initial={initial}
      animate={animate}
      transition={{ duration: duration.base, ease: easeOut, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

interface MotionStaggerProps extends HTMLMotionProps<'div'> {
  /** Stagger between children in seconds. Defaults to 0.06s (60ms). */
  stagger?: number;
}

export function MotionStagger({
  stagger = 0.06,
  children,
  ...rest
}: MotionStaggerProps) {
  // We can't mutate the imported `staggerContainer` object, so we
  // localise the variant and override the transition for this caller.
  const variants = {
    hidden: staggerContainer.hidden,
    visible: {
      ...(staggerContainer.visible as object),
      transition: { delayChildren: 0.05, staggerChildren: stagger },
    },
  };
  return (
    <motion.div initial="hidden" animate="visible" variants={variants} {...rest}>
      {children}
    </motion.div>
  );
}

/**
 * Used inside `<AnimatePresence mode="wait">` so only the active tab
 * remains mounted. The `key` prop is what triggers the crossfade.
 */
export function MotionTabContent({
  children,
  ...rest
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={tabCrossfade}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: duration.fast, ease: easeOut }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scroll-triggered section reveal. Fades + slides up when the element
 * scrolls into view (once). Wrap whole marketing sections with this so
 * the page feels alive but still respects reduced motion.
 */
export function MotionSection({
  children,
  ...rest
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={sectionReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scroll-triggered card reveal — a single card fades + scales in.
 * Pair with `<MotionCardStagger>` for orchestrated grids.
 */
export function MotionCardReveal({
  children,
  ...rest
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={cardReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ ...viewportOnce, margin: '0px 0px -60px 0px' }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scroll-triggered staggered grid. Wrap the grid, then render each card
 * inside a `motion.div` using the `cardReveal` variant (or use
 * `<MotionCardReveal>` which already wires `whileInView` per item).
 */
export function MotionCardStagger({
  children,
  ...rest
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ ...viewportOnce, margin: '0px 0px -60px 0px' }}
      variants={cardStagger}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
