import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/cn';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  variant?: 'subtle' | 'default' | 'solid' | 'interactive';
  glow?: 'none' | 'cyan' | 'crimson' | 'amber' | 'emerald' | 'racing' | 'gold';
  asymmetric?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = 'default',
  glow = 'none',
  asymmetric = false,
  ...props
}) => {
  const variantStyles = {
    subtle: 'bg-zinc-50/70 border border-zinc-200/80 shadow-sm',
    default: 'bg-white border border-zinc-200/90 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)]',
    solid: 'bg-zinc-50 border border-zinc-200 shadow-sm',
    interactive:
      'bg-white hover:bg-zinc-50/80 border border-zinc-200/90 hover:border-racing-500/50 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_-4px_rgba(225,6,0,0.12)] cursor-pointer transition-all',
  };

  const glowStyles = {
    none: '',
    cyan: 'hover:border-racing-500 hover:shadow-md',
    crimson: 'hover:border-racing-scarlet hover:shadow-md',
    racing: 'hover:border-racing-500 hover:shadow-md',
    amber: 'hover:border-amber-400 hover:shadow-md',
    gold: 'hover:border-amber-400 hover:shadow-md',
    emerald: 'hover:border-emerald-500 hover:shadow-md',
  };

  return (
    <motion.div
      className={cn(
        'relative transition-all duration-200 overflow-hidden',
        asymmetric ? 'racing-shape-asymmetric' : 'rounded-expressive-lg',
        variantStyles[variant],
        glowStyles[glow],
        className
      )}
      {...props}
    >
      {/* Flat vibrant racing red edge stripe on top */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-racing-600 via-racing-scarlet to-transparent opacity-80 pointer-events-none" />
      {children}
    </motion.div>
  );
};
