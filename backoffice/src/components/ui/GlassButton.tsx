import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/cn';
import { SnakeLoader } from '@/components/feedback/Loader';

interface GlassButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  icon?: React.ReactNode;
  loading?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  className,
  variant = 'secondary',
  size = 'md',
  icon,
  loading = false,
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-bold tracking-tight transition-all select-none overflow-hidden';

  const sizeStyles = {
    sm: variant === 'icon' ? 'w-8 h-8 rounded-xl p-1.5' : 'h-8 px-3.5 text-xs rounded-xl gap-1.5',
    md: variant === 'icon' ? 'w-10 h-10 rounded-2xl p-2' : 'h-10 px-5 text-sm rounded-2xl gap-2',
    lg: variant === 'icon' ? 'w-12 h-12 rounded-2.5xl p-3' : 'h-12 px-7 text-base rounded-2.5xl gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-racing-500 hover:bg-racing-scarlet text-white border border-racing-600 shadow-sm active:translate-y-0.5',
    secondary:
      'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700/60 shadow-sm active:translate-y-0.5',
    danger:
      'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm active:translate-y-0.5',
    ghost:
      'bg-transparent hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-transparent',
    icon:
      'bg-zinc-100 hover:bg-racing-500 text-zinc-600 hover:text-white border border-zinc-200/90 shadow-sm active:scale-95',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      disabled={disabled || loading}
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        (disabled || loading) && 'opacity-65 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {loading ? (
        <SnakeLoader size={size === 'sm' ? 'xs' : 'sm'} className="shrink-0" />
      ) : (
        icon
      )}
      {children}
    </motion.button>
  );
};
