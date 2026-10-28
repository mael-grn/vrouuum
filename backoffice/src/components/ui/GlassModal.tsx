import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';

export type ModalVariant = 'dialog' | 'editor';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  headerRight?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: ModalVariant;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  footer?: React.ReactNode;
}

// Apple / Raycast physics and easing curves
const appleEase = [0.16, 1, 0.3, 1] as const;
const appleExitEase = [0.32, 0, 0.67, 0] as const;

const backdropVariants: Variants = {
  initial: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
  },
  animate: {
    opacity: 1,
    backdropFilter: 'blur(16px)',
    transition: {
      duration: 0.3,
      ease: appleEase,
    },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: 0.2,
      ease: appleExitEase,
    },
  },
};

const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.94,
    y: 18,
    filter: 'blur(8px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 28,
      mass: 0.85,
      opacity: { duration: 0.22, ease: appleEase },
      filter: { duration: 0.22, ease: appleEase },
      staggerChildren: 0.045,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 12,
    filter: 'blur(6px)',
    transition: {
      duration: 0.18,
      ease: appleExitEase,
    },
  },
};

const headerVariants: Variants = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: appleEase } },
};

const bodyVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: appleEase } },
};

const reducedBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.14 } },
};

const reducedModalVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.14 } },
};

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  headerRight,
  children,
  variant = 'dialog',
  maxWidth,
  footer,
}) => {
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const maxWidthStyles: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  const variantStyles: Record<ModalVariant, { width: string; maxHeight: string }> = {
    dialog: {
      width: maxWidth && maxWidthStyles[maxWidth] ? maxWidthStyles[maxWidth] : 'max-w-lg',
      maxHeight: 'max-h-[70vh]',
    },
    editor: {
      width: maxWidth && maxWidthStyles[maxWidth] ? maxWidthStyles[maxWidth] : 'max-w-4xl lg:max-w-5xl',
      maxHeight: 'max-h-[82vh]',
    },
  };

  const selectedDimensions = variantStyles[variant];

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
          {/* Multi-layered Cinematic Backdrop */}
          <motion.div
            variants={shouldReduceMotion ? reducedBackdropVariants : backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/75 cursor-pointer"
          />

          {/* Modal Card - Centered clean fluid entrance */}
          <motion.div
            variants={shouldReduceMotion ? reducedModalVariants : modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`relative flex flex-col w-full ${selectedDimensions.width} ${selectedDimensions.maxHeight} rounded-[30px] bg-white border border-zinc-200/90 shadow-[0_28px_70px_-15px_rgba(0,0,0,0.38)] z-10 overflow-hidden text-zinc-900 select-text transform-gpu`}
          >
            {/* Minimal Header with reduced bottom margin */}
            {(title || headerRight) && (
              <motion.div variants={headerVariants} className="shrink-0 px-6 pt-4 pb-0.5 relative z-10 flex items-center justify-between gap-3">
                {title && (
                  <h3 className="text-sm font-bold text-zinc-900 tracking-tight leading-snug">
                    {title}
                  </h3>
                )}
                {headerRight && <div className="shrink-0">{headerRight}</div>}
              </motion.div>
            )}

            {/* Scrollable Content Area */}
            <motion.div
              variants={bodyVariants}
              className="flex-1 min-h-0 overflow-y-auto px-6 pt-1 pb-3 relative z-10 [&_form>div:last-child]:sticky [&_form>div:last-child]:bottom-0 [&_form>div:last-child]:-mx-6 [&_form>div:last-child]:px-6 [&_form>div:last-child]:py-3 [&_form>div:last-child]:bg-white/95 [&_form>div:last-child]:backdrop-blur-xs [&_form>div:last-child]:border-t [&_form>div:last-child]:border-zinc-100 [&_form>div:last-child]:mt-4 [&_form>div:last-child]:z-10"
            >
              {children}
            </motion.div>

            {/* Optional explicit fixed footer */}
            {footer && (
              <div className="shrink-0 px-6 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2.5 z-10 relative">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
