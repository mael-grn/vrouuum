import React from 'react';
import { cn } from '@/utils/cn';

interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'crimson' | 'amber' | 'emerald' | 'purple' | 'neutral' | 'racing' | 'gold';
  size?: 'xs' | 'sm' | 'md';
  icon?: React.ReactNode;
  slant?: boolean;
  className?: string;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  icon,
  slant = false,
  className,
}) => {
  const sizeStyles = {
    xs: 'text-[10px] px-2.5 py-0.5 rounded-lg gap-1 tracking-wider uppercase font-extrabold font-mono',
    sm: 'text-xs px-3 py-1 rounded-xl gap-1.5 font-bold',
    md: 'text-sm px-4 py-1.5 rounded-2xl gap-2 font-bold',
  };

  const variantStyles = {
    neutral:
      'bg-zinc-100 text-zinc-800 border border-zinc-200/90 font-bold',
    racing:
      'bg-racing-500 text-white border border-racing-600 font-black shadow-sm',
    crimson:
      'bg-rose-100 text-rose-800 border border-rose-200 font-bold',
    cyan:
      'bg-racing-50 text-racing-600 border border-racing-200 font-bold',
    amber:
      'bg-amber-100 text-amber-800 border border-amber-200 font-bold',
    gold:
      'bg-amber-400 text-zinc-950 border border-amber-300 font-black shadow-sm',
    emerald:
      'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold',
    purple:
      'bg-violet-100 text-violet-800 border border-violet-200 font-bold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center transition-all duration-200 select-none uppercase tracking-wide',
        slant && 'racing-slant',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      <span className={cn('inline-flex items-center gap-1.5', slant && 'racing-slant-content')}>
        {icon}
        {children}
      </span>
    </span>
  );
};
