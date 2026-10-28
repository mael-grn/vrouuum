import React, { useState } from 'react';
import { getBrandLogoUrl } from '../utils/automotiveMedia';
import { cn } from '@/utils/cn';

interface BrandLogoProps {
  name: string;
  logo?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  frameless?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 p-1 rounded-lg text-xs',
  md: 'w-11 h-11 p-1.5 rounded-xl text-sm',
  lg: 'w-14 h-14 p-2 rounded-2xl text-base',
  xl: 'w-24 h-24 p-0 text-xl',
  '2xl': 'w-32 h-32 p-0 text-2xl',
};

const framelessSizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 sm:w-28 sm:h-28 text-xl',
  '2xl': 'w-32 h-32 sm:w-36 sm:h-36 text-2xl',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  name,
  logo,
  className = '',
  size = 'md',
  frameless = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const logoUrl = getBrandLogoUrl(name, logo);

  if (hasError || !logoUrl) {
    const initials = name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    if (frameless) {
      return (
        <div
          className={cn(
            framelessSizeClasses[size],
            'flex items-center justify-center text-racing-600 font-display font-black italic tracking-tighter select-none',
            className
          )}
          title={name}
        >
          <span className="text-xl sm:text-2xl text-zinc-300 font-black">{initials || 'CR'}</span>
        </div>
      );
    }

    return (
      <div
        className={cn(
          sizeClasses[size],
          'bg-racing-50 border border-racing-200 flex items-center justify-center text-racing-600 font-black font-mono shrink-0 select-none',
          className
        )}
        title={name}
      >
        {initials || 'CR'}
      </div>
    );
  }

  if (frameless) {
    return (
      <div
        className={cn(
          framelessSizeClasses[size],
          'flex items-center justify-center shrink-0 pointer-events-none select-none',
          className
        )}
      >
        <img
          src={logoUrl}
          alt={`Logo ${name}`}
          onError={() => setHasError(true)}
          className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.14)]"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        sizeClasses[size],
        'bg-white border border-zinc-200/80 shadow-xs flex items-center justify-center shrink-0 overflow-hidden',
        className
      )}
    >
      <img
        src={logoUrl}
        alt={`Logo ${name}`}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  );
};
