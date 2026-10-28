import React from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants, type Transition } from 'framer-motion';
import { cn } from '@/utils/cn';

/**
 * Apple-grade signature cubic-bezier and spring physics curves.
 * Modeled after iOS 18 / macOS Sequoia and Apple Keynote fluid motion dynamics.
 */
export const appleEase = [0.16, 1, 0.3, 1] as const;
export const appleExitEase = [0.32, 0, 0.67, 0] as const;

export const appleSpring: Transition = {
  type: 'spring',
  stiffness: 240,
  damping: 26,
  mass: 0.85,
};

export const appleStaggerSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 28,
  mass: 0.75,
};

/**
 * Global Page-level entrance and exit variants.
 * Strictly avoids horizontal scale to prevent any screen overflow or horizontal scrollbar.
 */
export const applePageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 16,
    filter: 'blur(8px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      y: appleSpring,
      opacity: { duration: 0.3, ease: appleEase },
      filter: { duration: 0.28, ease: appleEase },
      staggerChildren: 0.045,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: 'blur(4px)',
    transition: {
      duration: 0.18,
      ease: appleExitEase,
    },
  },
};

/**
 * Staggered child item variants (sections, cards, toolbars, headers)
 */
export const appleItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 14,
    filter: 'blur(6px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      y: appleStaggerSpring,
      opacity: { duration: 0.28, ease: appleEase },
      filter: { duration: 0.24, ease: appleEase },
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    filter: 'blur(3px)',
    transition: {
      duration: 0.14,
      ease: appleExitEase,
    },
  },
};

/**
 * Prominent header / hero variants for section titles
 */
export const appleHeaderVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
    filter: 'blur(6px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      y: appleSpring,
      opacity: { duration: 0.3, ease: appleEase },
      filter: { duration: 0.26, ease: appleEase },
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.14 },
  },
};

/**
 * Reduced-motion accessible variants (strictly opacity crossfade)
 */
const reducedPageVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

const reducedItemVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

interface PageTransitionProps {
  /** Unique key identifying the page or view state */
  pageKey: string | number;
  children: React.ReactNode;
  className?: string;
  /** Whether to show Apple-style atmospheric luminous top sheen on entrance */
  showAmbientSheen?: boolean;
}

/**
 * Apple-grade Global Page Transition Wrapper
 * Orchestrates entrance physics, depth blur, and vertical settling without any horizontal bleed.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  pageKey,
  children,
  className = 'max-w-7xl mx-auto w-full',
  showAmbientSheen = true,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const variants = shouldReduceMotion ? reducedPageVariants : applePageVariants;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pageKey}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn('relative min-h-full w-full overflow-x-clip', className)}
      >
        {/* Apple Luminous Top Specular Light Sheen - clipped to avoid horizontal scrollbar */}
        {showAmbientSheen && !shouldReduceMotion && (
          <div className="pointer-events-none absolute -top-4 inset-x-0 flex justify-center overflow-hidden h-16 select-none z-0">
            <motion.div
              initial={{ opacity: 0, scaleX: 0.7 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: appleEase }}
              className="w-full max-w-xl h-full bg-radial from-racing-500/[0.06] via-racing-500/[0.01] to-transparent blur-xl rounded-full"
            />
          </div>
        )}

        <div className="relative z-10 w-full">
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

interface PageStaggerItemProps {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
}

/**
 * Wrapper for individual sections/cards inside a page to inherit Apple-style staggering.
 */
export const PageStaggerItem: React.FC<PageStaggerItemProps> = ({
  children,
  className = '',
  variants = appleItemVariants,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const activeVariants = shouldReduceMotion ? reducedItemVariants : variants;

  return (
    <motion.div variants={activeVariants} className={className}>
      {children}
    </motion.div>
  );
};
