import React from 'react';
import { cn } from '@/utils/cn';

interface SnakeLoaderProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  trackClassName?: string;
}

/**
 * Modern, thick snake loader with rounded stroke caps and smooth circular motion.
 */
export const SnakeLoader: React.FC<SnakeLoaderProps> = ({
  size = 'md',
  className,
  trackClassName,
}) => {
  const sizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <svg
      className={cn('animate-spin shrink-0', sizeClasses[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Chargement"
    >
      {/* Subtle circular track */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        className={cn('opacity-15', trackClassName)}
      />
      {/* Thick travelling snake arc */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeDasharray="18 38.5"
      />
    </svg>
  );
};

export const Loader: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <SnakeLoader size={size} className="text-racing-500" />
    </div>
  );
};
