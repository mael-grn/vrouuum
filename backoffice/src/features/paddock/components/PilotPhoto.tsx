import React, { useState, useEffect } from 'react';
import { getCachedCutout, processCarCutout } from '../utils/carImageCutout';
import { resolvePilotPhotoUrl } from '../utils/automotiveMedia';
import { cn } from '@/utils/cn';
import { User } from 'lucide-react';

interface PilotPhotoProps {
  name: string;
  surname: string;
  photo?: string | null;
  className?: string;
  containerClassName?: string;
}

export const PilotPhoto: React.FC<PilotPhotoProps> = ({
  name,
  surname,
  photo,
  className = '',
  containerClassName = '',
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setHasError(false);

    const fullName = `${name} ${surname}`.trim();
    const cacheKey = `pilot_${fullName.toLowerCase()}`;

    // 1. Check if we already have the AI cutout cached in IndexedDB
    getCachedCutout(cacheKey)
      .then(async (cachedCutout) => {
        if (isCancelled) return;
        if (cachedCutout) {
          setImageUrl(cachedCutout);
          setIsLoading(false);
          return;
        }

        // 2. Resolve image URL: either custom prop or Wikipedia
        let rawUrl = photo;
        if (!rawUrl) {
          rawUrl = await resolvePilotPhotoUrl(fullName);
        }

        if (isCancelled) return;
        if (!rawUrl) {
          setImageUrl(null);
          setIsLoading(false);
          return;
        }

        // 3. Process AI background removal for the pilot
        try {
          const cutoutUrl = await processCarCutout(cacheKey, rawUrl);
          if (!isCancelled) {
            setImageUrl(cutoutUrl);
            setIsLoading(false);
          }
        } catch {
          if (!isCancelled) {
            setImageUrl(rawUrl);
            setIsLoading(false);
          }
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setImageUrl(null);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [name, surname, photo]);

  const initials = `${name?.[0] || ''}${surname?.[0] || ''}`.toUpperCase();

  if (isLoading) {
    return (
      <div className={cn('relative w-full h-full flex items-center justify-center', containerClassName)}>
        <div className="w-16 h-20 rounded-2xl bg-zinc-100 animate-pulse flex items-center justify-center">
          <User className="w-6 h-6 text-zinc-300" />
        </div>
      </div>
    );
  }

  if (!imageUrl || hasError) {
    return (
      <div
        className={cn(
          'w-20 h-24 sm:w-22 sm:h-28 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex flex-col items-center justify-center text-zinc-400 group-hover:border-racing-300/60 group-hover:text-racing-600 transition-colors shadow-xs',
          containerClassName
        )}
      >
        <User className="w-6 h-6 mb-1 text-zinc-300 group-hover:text-racing-500 transition-colors" />
        <span className="font-display font-black text-sm tracking-tight">{initials || 'PL'}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative w-full h-full flex items-center justify-center select-none pointer-events-none',
        containerClassName
      )}
    >
      <img
        src={imageUrl}
        alt={`${name} ${surname}`}
        onError={() => setHasError(true)}
        className={cn(
          'h-full max-w-full object-contain filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.18)] group-hover:scale-105 transition-transform duration-300',
          className
        )}
        loading="lazy"
      />
    </div>
  );
};
