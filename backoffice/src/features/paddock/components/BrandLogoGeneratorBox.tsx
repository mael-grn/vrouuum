import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Aperture, RefreshCw, SearchX } from 'lucide-react';
import { getBrandLogoUrl } from '../utils/automotiveMedia';
import { processCarCutout, getCachedCutout } from '../utils/carImageCutout';

interface BrandLogoGeneratorBoxProps {
  brandName?: string;
  name?: string;
  logoUrl: string | null;
  onGenerated: (url: string | null) => void;
  resolveUrl?: (name: string) => Promise<string | null>;
  placeholderType?: 'brand' | 'team' | 'pilot';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  u: number;
  vOffset: number;
  layer: number;
  phase: number;
  targetX?: number;
  targetY?: number;
  radius: number;
  alpha: number;
  mode: 'burst' | 'wave' | 'converging' | 'fading';
}

/**
 * Extracts sample coordinates of the logo silhouette from the image alpha channel
 */
async function extractSilhouettePoints(
  imgUrl: string,
  canvasWidth: number,
  canvasHeight: number,
  pointCount: number,
  isPilot = false
): Promise<Array<{ x: number; y: number }>> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const fallback = () => {
      const points: Array<{ x: number; y: number }> = [];
      const cx = canvasWidth / 2;
      const cy = canvasHeight / 2;
      const r = Math.min(canvasWidth, canvasHeight) * 0.28;
      for (let i = 0; i < pointCount; i++) {
        const angle = (i / pointCount) * Math.PI * 2;
        points.push({
          x: cx + Math.cos(angle) * r + (Math.random() - 0.5) * 16,
          y: cy + Math.sin(angle) * r + (Math.random() - 0.5) * 16,
        });
      }
      resolve(points);
    };

    img.onload = () => {
      try {
        const offscreen = document.createElement('canvas');
        const aspect = img.width / img.height;

        const maxBoxW = canvasWidth * (isPilot ? 0.55 : 0.60);
        const maxBoxH = canvasHeight * (isPilot ? 0.82 : 0.60);
        let targetW = maxBoxW;
        let targetH = targetW / aspect;
        if (targetH > maxBoxH) {
          targetH = maxBoxH;
          targetW = targetH * aspect;
        }

        offscreen.width = Math.max(1, Math.round(targetW));
        offscreen.height = Math.max(1, Math.round(targetH));
        const ctx = offscreen.getContext('2d');
        if (!ctx) {
          fallback();
          return;
        }

        ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
        const imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
        const data = imgData.data;

        const validPixels: Array<{ x: number; y: number }> = [];
        const offsetX = (canvasWidth - targetW) / 2;
        const offsetY = (canvasHeight - targetH) / 2;

        const step = 3;
        for (let y = 0; y < offscreen.height; y += step) {
          for (let x = 0; x < offscreen.width; x += step) {
            const alpha = data[(y * offscreen.width + x) * 4 + 3];
            if (alpha > 40) {
              validPixels.push({
                x: offsetX + x,
                y: offsetY + y,
              });
            }
          }
        }

        if (validPixels.length === 0) {
          fallback();
          return;
        }

        const sampled: Array<{ x: number; y: number }> = [];
        for (let i = 0; i < pointCount; i++) {
          const idx = Math.floor(Math.random() * validPixels.length);
          sampled.push(validPixels[idx]);
        }
        resolve(sampled);
      } catch {
        fallback();
      }
    };

    img.onerror = () => {
      fallback();
    };

    img.src = imgUrl;
  });
}

export const BrandLogoGeneratorBox: React.FC<BrandLogoGeneratorBoxProps> = ({
  brandName,
  name,
  logoUrl,
  onGenerated,
  resolveUrl,
  placeholderType = 'brand',
}) => {
  const entityName = (name !== undefined ? name : brandName) || '';
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState<'retrieving' | 'cutting' | 'converging' | null>(null);
  const [justMaterialized, setJustMaterialized] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const hasName = Boolean(entityName.trim());

  // Check if pilot already has cached cutout in IndexedDB
  useEffect(() => {
    if (placeholderType === 'pilot' && entityName) {
      const cacheKey = `pilot_${entityName.toLowerCase().trim()}`;
      getCachedCutout(cacheKey).then((cached) => {
        if (cached) setCutoutUrl(cached);
      });
    } else {
      setCutoutUrl(null);
    }
  }, [placeholderType, entityName]);

  // Reset not-found state when user types a new brand name
  useEffect(() => {
    setNotFound(false);
  }, [brandName]);

  // Modern wave physics & single-path batch render (100% black particles, smooth & cohesive)
  const updateAndDrawParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = performance.now();
    let hasAliveParticles = false;
    const particles = particlesRef.current;
    const len = particles.length;

    const H = canvas.height;
    const time = now * 0.0011;

    ctx.fillStyle = '#000000'; // All points are solid black
    ctx.beginPath();

    for (let i = 0; i < len; i++) {
      const p = particles[i];
      if (p.alpha <= 0.01) continue;
      hasAliveParticles = true;

      if (p.mode === 'burst') {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.92;
        p.vy *= 0.92;
        if (Math.hypot(p.vx, p.vy) < 0.45) {
          p.mode = 'wave';
        }
      } else if (p.mode === 'wave') {
        const envelope = Math.sin(p.u * Math.PI);
        const waveY =
          Math.sin(p.u * 2.8 * Math.PI - time * 1.6 + p.layer * 0.75) * 20 +
          Math.sin(p.u * 5.2 * Math.PI + time * 1.1) * 6;

        const idealY = H / 2 + p.vOffset + waveY * envelope;
        const idealX = p.baseX + Math.cos(time * 1.2 + p.phase) * 4;

        p.x += (idealX - p.x) * 0.055;
        p.y += (idealY - p.y) * 0.055;
      } else if (p.mode === 'converging') {
        if (p.targetX !== undefined && p.targetY !== undefined) {
          p.x += (p.targetX - p.x) * 0.085;
          p.y += (p.targetY - p.y) * 0.085;
        }
      } else if (p.mode === 'fading') {
        p.alpha *= 0.91;
      }

      ctx.moveTo(p.x + p.radius, p.y);
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    }

    ctx.fill();

    if (hasAliveParticles) {
      animFrameRef.current = requestAnimationFrame(updateAndDrawParticles);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Cleanup anim loop
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Spawn particle cloud from button bounds
  const spawnButtonDisintegration = () => {
    const canvas = canvasRef.current;
    const button = buttonRef.current;
    const container = containerRef.current;
    if (!canvas || !button || !container) return;

    const contRect = container.getBoundingClientRect();
    const btnRect = button.getBoundingClientRect();

    canvas.width = contRect.width;
    canvas.height = contRect.height;

    const bx = btnRect.left - contRect.left;
    const by = btnRect.top - contRect.top;
    const bw = btnRect.width;
    const bh = btnRect.height;
    const cx = bx + bw / 2;
    const cy = by + bh / 2;

    const W = contRect.width;
    const count = 550;
    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const px = bx + Math.random() * bw;
      const py = by + Math.random() * bh;
      const dx = px - cx;
      const dy = py - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const burstSpeed = 1.2 + Math.random() * 2.8;

      const u = (i + Math.random() * 0.5) / count;
      const vOffset = (Math.random() - 0.5) * 26 + (Math.random() - 0.5) * 12;
      const layer = i % 3;

      particles.push({
        x: px,
        y: py,
        vx: (dx / dist) * burstSpeed + (Math.random() - 0.5) * 1.0,
        vy: (dy / dist) * burstSpeed + (Math.random() - 0.5) * 1.0,
        baseX: W * (0.12 + 0.76 * u),
        u,
        vOffset,
        layer,
        phase: Math.random() * Math.PI * 2,
        radius: 0.65 + Math.random() * 0.5,
        alpha: 1.0,
        mode: 'burst',
      });
    }

    particlesRef.current = particles;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(updateAndDrawParticles);
  };

  const handleGenerate = async () => {
    if (!hasName || isGenerating) return;

    setNotFound(false);
    spawnButtonDisintegration();
    setIsGenerating(true);
    setJustMaterialized(false);
    setLoadingStep('retrieving'); // State 1: Récupération...

    const startTime = performance.now();

    try {
      // 1. Resolve official logo/photo URL (custom resolver or CDN)
      let rawUrl: string | null = null;
      if (resolveUrl) {
        rawUrl = await resolveUrl(entityName);
      } else {
        rawUrl = getBrandLogoUrl(entityName);
      }

      // Preload image and verify if it actually exists (404 check)
      const isAvailable = await new Promise<boolean>((resolve) => {
        if (!rawUrl) return resolve(false);
        const testImg = new Image();
        testImg.onload = () => resolve(true);
        testImg.onerror = () => resolve(false);
        testImg.src = rawUrl;
      });

      if (!isAvailable || !rawUrl) {
        // Not found: dissolve particles and show not-found state
        particlesRef.current.forEach((p) => {
          p.mode = 'fading';
        });
        await new Promise((r) => setTimeout(r, 350));
        setNotFound(true);
        onGenerated(null);
        return;
      }

      let finalUrl = rawUrl;

      // 2. If pilot: Perform AI background removal (Détourage...)
      if (placeholderType === 'pilot') {
        setLoadingStep('cutting');
        const cacheKey = `pilot_${entityName.toLowerCase().trim()}`;
        try {
          const cut = await processCarCutout(cacheKey, rawUrl);
          if (cut) {
            finalUrl = cut;
            setCutoutUrl(cut);
          }
        } catch {
          finalUrl = rawUrl;
        }
      }

      // Guarantee minimum wave animation time (850ms) so button disintegration and wave fully play out!
      const elapsed = performance.now() - startTime;
      if (elapsed < 850) {
        await new Promise((r) => setTimeout(r, 850 - elapsed));
      }

      // 3. Extract silhouette points from image matching container
      const canvas = canvasRef.current;
      const width = canvas?.width || 500;
      const height = canvas?.height || 280;
      const silhouettePoints = await extractSilhouettePoints(
        finalUrl,
        width,
        height,
        particlesRef.current.length,
        placeholderType === 'pilot'
      );

      // 4. Particles coalesce to form silhouette
      setLoadingStep('converging');
      particlesRef.current.forEach((p, idx) => {
        p.mode = 'converging';
        if (silhouettePoints[idx]) {
          p.targetX = silhouettePoints[idx].x;
          p.targetY = silhouettePoints[idx].y;
        }
      });

      // Pause to let user perceive the silhouette regrouping
      await new Promise((r) => setTimeout(r, 750));

      // 5. Reveal final image and fade particles
      particlesRef.current.forEach((p) => {
        p.mode = 'fading';
      });

      setJustMaterialized(true);
      onGenerated(rawUrl);
    } catch {
      setNotFound(true);
      onGenerated(null);
    } finally {
      setIsGenerating(false);
      setLoadingStep(null);
    }
  };

  return (
    <div className="w-full">
      {/* Main Container - Minimalist White & Borderless */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden select-none transition-all duration-300 bg-transparent flex items-center justify-center"
      >
        {/* Particle Canvas Layer */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* ========================================================================= */}
        {/* STATE 1 & 2: LOADING (MODERN WAVE & STATIC STEP TEXT)                     */}
        {/* ========================================================================= */}
        {isGenerating && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-between p-4 pointer-events-none">
            {/* Top static clean step text (no tag, no motion) */}
            <div className="pt-2">
              <AnimatePresence mode="wait">
                {loadingStep === 'retrieving' && (
                  <motion.span
                    key="step-retrieving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="font-sans text-xs font-medium text-zinc-500 select-none tracking-wide"
                  >
                    Récupération...
                  </motion.span>
                )}

                {loadingStep === 'cutting' && (
                  <motion.span
                    key="step-cutting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="font-sans text-xs font-medium text-zinc-500 select-none tracking-wide"
                  >
                    Détourage...
                  </motion.span>
                )}

                {loadingStep === 'converging' && null}
              </AnimatePresence>
            </div>
            <div />
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 3: GENERATED LOGO/PHOTO (CLEAN MINIMALIST SHOWROOM)                */}
        {/* ========================================================================= */}
        {!isGenerating && (cutoutUrl || logoUrl) && (
          <div className="absolute inset-0 flex items-center justify-center p-0 group z-20">
            {/* Minimalist Soft Contact Shadow */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-48 h-3.5 bg-black/[0.08] blur-md rounded-full pointer-events-none" />

            {/* Fluid Logo/Photo Materialization - above particles */}
            <motion.div
              initial={justMaterialized ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`relative z-20 ${
                placeholderType === 'pilot' ? 'w-[55%] h-[82%]' : 'w-[60%] h-[60%]'
              } flex items-center justify-center`}
            >
              <img
                src={cutoutUrl || logoUrl!}
                alt={`${placeholderType === 'pilot' ? 'Photo' : 'Logo'} ${entityName}`}
                className={`w-full h-full object-contain ${
                  placeholderType === 'pilot' ? 'rounded-2xl' : ''
                } filter drop-shadow-[0_12px_22px_rgba(0,0,0,0.18)] group-hover:scale-105 transition-transform duration-300`}
              />
            </motion.div>

            {/* Hover Action: Minimalist White Glass Overlay */}
            <div className="absolute inset-0 bg-white/75 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 z-30">
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 text-white font-sans font-medium text-xs hover:bg-black shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-white" />
                {placeholderType === 'pilot' ? 'Regénérer la photo' : 'Regénérer le logo'}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 4: NOT FOUND MESSAGE                                                */}
        {/* ========================================================================= */}
        {!isGenerating && !(cutoutUrl || logoUrl) && notFound && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center z-10 select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
              <SearchX className="w-5 h-5 text-zinc-400" />
            </div>
            <p className="font-sans text-xs sm:text-sm font-semibold text-zinc-800">
              {placeholderType === 'pilot'
                ? `Aucune photo trouvée pour le pilote « ${entityName} »`
                : `Aucun logo trouvé pour ${
                    placeholderType === 'team' ? "l'écurie" : 'le constructeur'
                  } « ${entityName} »`}
            </p>
            <p className="font-sans text-[11px] text-zinc-400 mt-1 max-w-xs leading-normal">
              Vous pouvez coller manuellement l'URL de votre choix dans le champ ci-contre.
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-sans text-xs font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-zinc-500" />
              Réessayer
            </button>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* STATE 5: IDLE / UNGENERATED                                              */}
        {/* ========================================================================= */}
        {!isGenerating && !(cutoutUrl || logoUrl) && !notFound && (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center z-10">
            {/* Disintegrating Pill Button - Always visible, grayed out if !hasName */}
            <motion.button
              ref={buttonRef}
              type="button"
              disabled={!hasName}
              onClick={handleGenerate}
              whileHover={hasName ? { scale: 1.03 } : undefined}
              whileTap={hasName ? { scale: 0.96 } : undefined}
              className={`px-5 py-2.5 rounded-full font-sans font-medium text-xs transition-all flex items-center gap-2 ${
                hasName
                  ? 'bg-zinc-900 text-white shadow-sm hover:bg-black cursor-pointer group'
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed select-none'
              }`}
            >
              <Aperture
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  hasName ? 'text-zinc-300 group-hover:rotate-45' : 'text-zinc-400'
                }`}
              />
              {placeholderType === 'pilot' ? 'Photo automatique' : 'Logo automatique'}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};
