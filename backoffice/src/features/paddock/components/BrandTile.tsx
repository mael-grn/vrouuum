import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Pencil } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import type { Brand } from '@/types';

interface BrandTileProps {
  brand: Brand;
  vehicleCount: number;
  onClick: (brandId: number) => void;
  onEdit?: (brand: Brand) => void;
}

export const BrandTile: React.FC<BrandTileProps> = ({
  brand,
  vehicleCount,
  onClick,
  onEdit,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse coordinate values normalized between -0.5 and 0.5
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Subtle image displacement following mouse position (the tile stays still, image floats smoothly)
  const imageX = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), {
    stiffness: 300,
    damping: 24,
  });
  const imageY = useSpring(useTransform(y, [-0.5, 0.5], [-8, 8]), {
    stiffness: 300,
    damping: 24,
  });

  // Spotlight coordinates in px
  const spotlightX = useMotionValue(0);
  const spotlightY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseXFromCenter = e.clientX - rect.left - width / 2;
    const mouseYFromCenter = e.clientY - rect.top - height / 2;

    x.set(mouseXFromCenter / width);
    y.set(mouseYFromCenter / height);

    spotlightX.set(e.clientX - rect.left);
    spotlightY.set(e.clientY - rect.top);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onClick(brand.id)}
      whileTap={{ scale: 0.98 }}
      className="group relative cursor-pointer select-none rounded-[28px] bg-white border border-zinc-200/90 p-6 sm:p-7 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-xl hover:border-racing-500/50 transition-colors duration-300 min-h-[240px] sm:min-h-[260px] overflow-hidden"
    >
      {/* Dynamic Cursor Spotlight Following Mouse */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[28px]"
        style={{
          background: useTransform(
            [spotlightX, spotlightY],
            ([sx, sy]) =>
              `radial-gradient(240px circle at ${sx}px ${sy}px, rgba(225, 6, 0, 0.08), transparent 75%)`
          ),
        }}
      />

      {/* Atmospheric Ambient Red Glow Behind Logo on Hover */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-16 w-36 h-36 rounded-full bg-racing-500/0 group-hover:bg-racing-500/15 blur-2xl transition-all duration-500 pointer-events-none scale-75 group-hover:scale-125" />

      {/* Subtle Racing Diagonal Energy Watermark */}
      <div className="absolute -right-8 -bottom-8 font-display font-black italic text-8xl text-zinc-950/[0.03] group-hover:text-racing-500/[0.06] transition-colors duration-500 pointer-events-none uppercase select-none leading-none">
        {brand.name.slice(0, 3)}
      </div>

      {/* Quick Edit Action Button */}
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(brand);
          }}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-xl bg-zinc-100/90 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-950 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xs cursor-pointer"
          title="Modifier le constructeur"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Center Stage: Frameless Big Logo Floating with Mouse Tracking */}
      <div className="relative z-10 flex items-center justify-center h-28 sm:h-32 w-full mb-3">
        <motion.div
          style={{ x: imageX, y: imageY }}
          className="flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-[1.12]"
        >
          <BrandLogo
            name={brand.name}
            logo={brand.logo}
            size="xl"
            frameless
            className="transition-transform duration-300 drop-shadow-[0_10px_20px_rgba(0,0,0,0.12)] group-hover:drop-shadow-[0_16px_28px_rgba(225,6,0,0.28)]"
          />
        </motion.div>
      </div>

      {/* Brand Name Directly Below the Logo */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 w-full">
        <h3 className="font-display font-black text-xl sm:text-2xl text-zinc-950 group-hover:text-racing-600 transition-colors duration-200 tracking-tight leading-tight uppercase italic">
          {brand.name}
        </h3>

        {/* Dynamic Expanding Racing Red Accent Bar */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          className="h-1 bg-gradient-to-r from-racing-600 via-racing-500 to-racing-scarlet rounded-full group-hover:opacity-100 group-hover:w-12 transition-all duration-300"
        />

        {/* Discreet Vehicle Count & Country Info */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-mono font-bold text-zinc-500 group-hover:text-zinc-700 transition-colors">
            {vehicleCount} {vehicleCount > 1 ? 'véhicules' : 'véhicule'}
          </span>
          {brand.country && (
            <>
              <span className="w-1 h-1 rounded-full bg-zinc-300 group-hover:bg-racing-400 transition-colors" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 group-hover:text-zinc-600 transition-colors font-semibold">
                {brand.country}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
