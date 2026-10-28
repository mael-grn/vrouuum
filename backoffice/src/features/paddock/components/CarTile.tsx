import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { CarImage } from './CarImage';
import type { Car } from '@/types';

interface CarTileProps {
  car: Car;
  brandName: string;
  onClick?: (car: Car) => void;
}

export const CarTile: React.FC<CarTileProps> = ({ car, brandName, onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse coordinate values normalized between -0.5 and 0.5
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Subtle image displacement following mouse position (tile stays still, image moves smoothly)
  const imageX = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), {
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
      onClick={() => onClick?.(car)}
      whileTap={{ scale: 0.98 }}
      className="group relative cursor-pointer select-none rounded-[28px] bg-white border border-zinc-200/90 p-6 sm:p-7 flex flex-col items-center justify-between text-center shadow-sm hover:shadow-2xl hover:border-racing-500/50 transition-colors duration-300 min-h-[300px] sm:min-h-[330px] overflow-hidden"
    >
      {/* Dynamic Cursor Spotlight Following Mouse */}
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[28px]"
        style={{
          background: useTransform(
            [spotlightX, spotlightY],
            ([sx, sy]) =>
              `radial-gradient(280px circle at ${sx}px ${sy}px, rgba(225, 6, 0, 0.08), transparent 75%)`
          ),
        }}
      />

      {/* Atmospheric Ambient Red Glow Behind Car on Hover */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-12 w-48 h-48 rounded-full bg-racing-500/0 group-hover:bg-racing-500/15 blur-3xl transition-all duration-500 pointer-events-none scale-75 group-hover:scale-125" />

      {/* Subtle Racing Diagonal Model Name Watermark */}
      <div className="absolute -right-6 -bottom-6 font-display font-black italic text-8xl text-zinc-950/[0.03] group-hover:text-racing-500/[0.06] transition-colors duration-500 pointer-events-none uppercase select-none leading-none">
        {car.name.slice(0, 4)}
      </div>

      {/* Big Car 3D Render Floating directly in the Tile with Subtle Mouse Tracking */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center my-2">
        <motion.div
          style={{ x: imageX, y: imageY }}
          className="w-full flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-[1.08]"
        >
          <CarImage
            brandName={brandName}
            modelName={car.name}
            year={car.year}
            frameless
            className="w-full max-h-[160px] sm:max-h-[190px] drop-shadow-[0_16px_24px_rgba(0,0,0,0.18)] group-hover:drop-shadow-[0_24px_34px_rgba(225,6,0,0.28)]"
          />
        </motion.div>

        {/* Dynamic Ground Shadow Simulation Under the Car */}
        <motion.div
          style={{ x: imageX }}
          className="w-3/4 h-3 bg-black/10 rounded-full blur-md group-hover:bg-racing-950/20 group-hover:w-4/5 group-hover:blur-lg transition-all duration-300 pointer-events-none -mt-1"
        />
      </div>

      {/* Model Name and Year Directly Below */}
      <div className="relative z-10 flex flex-col items-center gap-2 w-full pt-3">
        <h3 className="font-display font-black text-2xl sm:text-3xl text-zinc-950 group-hover:text-racing-600 transition-colors duration-200 tracking-tight leading-tight uppercase italic">
          {car.name}
        </h3>

        {/* Expanding Racing Red Accent Bar */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          className="h-1 bg-gradient-to-r from-racing-600 via-racing-500 to-racing-scarlet rounded-full group-hover:opacity-100 group-hover:w-12 transition-all duration-300"
        />

        {/* Year Badge */}
        {car.year && (
          <span className="font-mono font-bold text-xs bg-zinc-100 text-zinc-600 group-hover:bg-racing-50 group-hover:text-racing-600 group-hover:border-racing-200/80 border border-zinc-200/80 px-3 py-0.5 rounded-full transition-colors mt-0.5">
            {car.year}
          </span>
        )}
      </div>
    </motion.div>
  );
};
