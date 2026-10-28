import React, { useState, useEffect } from 'react';
import { resolveCarImageUrl } from '../utils/automotiveMedia';
import { processCarCutout, getCachedCutout } from '../utils/carImageCutout';
import { Car as CarIcon, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';

interface CarImageProps {
  brandName: string;
  modelName: string;
  year?: number | null;
  className?: string;
  containerClassName?: string;
  frameless?: boolean;
}

export const CarImage: React.FC<CarImageProps> = ({
  brandName,
  modelName,
  year,
  className = '',
  containerClassName = '',
  frameless = false,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingCutout, setIsProcessingCutout] = useState(false);
  const [isCutout, setIsCutout] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setIsProcessingCutout(false);
    setIsCutout(false);
    setHasError(false);

    const cacheKey = `${brandName}_${modelName}_${year || ''}`.toLowerCase().trim();

    // Check if we already have the AI cutout cached in IndexedDB
    getCachedCutout(cacheKey)
      .then((cachedCutout) => {
        if (isCancelled) return;
        if (cachedCutout) {
          setImageUrl(cachedCutout);
          setIsCutout(true);
          setIsLoading(false);
          return;
        }

        // If not cached, resolve raw image from API
        return resolveCarImageUrl(brandName, modelName, year).then((rawUrl) => {
          if (isCancelled) return;
          if (!rawUrl) {
            setImageUrl(null);
            setIsLoading(false);
            return;
          }

          // Show raw image immediately for instant visual feedback
          setImageUrl(rawUrl);
          setIsLoading(false);

          // Asynchronously process AI background removal
          setIsProcessingCutout(true);
          processCarCutout(cacheKey, rawUrl)
            .then((cutoutUrl) => {
              if (!isCancelled && cutoutUrl) {
                setImageUrl(cutoutUrl);
                setIsCutout(true);
              }
            })
            .catch(() => {
              // Keeps the raw image if background removal fails
            })
            .finally(() => {
              if (!isCancelled) setIsProcessingCutout(false);
            });
        });
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
  }, [brandName, modelName, year]);

  if (frameless) {
    return (
      <div
        className={cn(
          'relative w-full aspect-[16/10] flex items-center justify-center p-0 select-none pointer-events-none overflow-visible',
          containerClassName
        )}
      >
        {/* Showroom Ambient Light Reflection */}
        <div className="absolute inset-0 bg-radial from-zinc-100/60 via-transparent to-transparent pointer-events-none" />

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <CarIcon className="w-14 h-14 text-zinc-300 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold animate-pulse">
              Recherche showroom...
            </span>
          </div>
        )}

        {/* Fallback Showroom Silhouette when no image found */}
        {!isLoading && (!imageUrl || hasError) && (
          <div className="flex flex-col items-center justify-center text-zinc-300 gap-2 z-10 py-4">
            <div className="w-20 h-20 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-center shadow-xs">
              <CarIcon className="w-10 h-10 text-zinc-400" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
              {modelName}
            </span>
          </div>
        )}

        {/* Car Image with Showroom Stage */}
        {!isLoading && imageUrl && !hasError && (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={imageUrl}
              alt={`${brandName} ${modelName}`}
              onError={() => setHasError(true)}
              loading="lazy"
              className={cn(
                'relative z-10 w-full h-full object-contain filter transition-all duration-500',
                isCutout
                  ? 'drop-shadow-[0_20px_26px_rgba(0,0,0,0.22)]'
                  : 'rounded-xl shadow-md',
                className
              )}
            />

            {/* Cutout Subtle Shimmer Indicator while processing */}
            {isProcessingCutout && (
              <div className="absolute top-0 right-0 z-20 flex items-center gap-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-sans font-medium px-2 py-0.5 rounded-full border border-zinc-700 pointer-events-none animate-pulse">
                <Sparkles className="w-2.5 h-2.5 text-racing-scarlet" />
                <span>Détourage...</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Boxed format (for modal previews)
  return (
    <div
      className={cn(
        'relative w-full aspect-[16/9] bg-gradient-to-b from-zinc-100 via-zinc-50 to-zinc-100/80 rounded-2xl border border-zinc-200/70 flex items-center justify-center p-3 overflow-hidden group/img',
        containerClassName
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/90 via-zinc-100/40 to-transparent pointer-events-none" />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/80 animate-pulse">
          <CarIcon className="w-10 h-10 text-zinc-300" />
        </div>
      )}

      {!isLoading && (!imageUrl || hasError) ? (
        <div className="flex flex-col items-center justify-center text-zinc-400 gap-1.5 z-10">
          <CarIcon className="w-12 h-12 text-zinc-300" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
            {modelName}
          </span>
        </div>
      ) : (
        !isLoading &&
        imageUrl && (
          <img
            src={imageUrl}
            alt={`${brandName} ${modelName}`}
            onError={() => setHasError(true)}
            loading="lazy"
            className={cn(
              'relative z-10 w-full h-full object-contain drop-shadow-[0_12px_14px_rgba(0,0,0,0.14)] transition-all duration-300',
              className
            )}
          />
        )
      )}

      <div className="absolute bottom-2 inset-x-8 h-2 bg-black/10 rounded-full blur-md pointer-events-none" />
    </div>
  );
};
