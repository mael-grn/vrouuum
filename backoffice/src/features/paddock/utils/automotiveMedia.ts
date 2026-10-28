/**
 * Automotive Media Utilities
 * Standardizes Brand Logos and Vehicle Images from trusted automotive APIs.
 */

// Mapping of custom aliases to canonical brand slugs supported by filippofilip95/car-logos-dataset
const BRAND_ALIASES: Record<string, string> = {
  mercedes: 'mercedes-benz',
  'mercedes benz': 'mercedes-benz',
  'mercedes-amg': 'mercedes-benz',
  'mercedes amg': 'mercedes-benz',
  'aston martin': 'aston-martin',
  'alfa romeo': 'alfa-romeo',
  corvette: 'chevrolet',
  'general motors': 'chevrolet',
  'toyota gazoo racing': 'toyota',
  'scuderia ferrari': 'ferrari',
  'ferrari af corse': 'ferrari',
  'af corse': 'ferrari',
  'porsche penske': 'porsche',
  'porsche penske motorsport': 'porsche',
  'bmw m': 'bmw',
  'bmw m team wrt': 'bmw',
  'team wrt': 'bmw',
  'red bull': 'red-bull',
  'red bull racing': 'red-bull',
  'alpine endurance team': 'alpine',
  'cadillac racing': 'cadillac',
  peugeot: 'peugeot',
  'peugeot totalenergies': 'peugeot',
  'iron lynx': 'lamborghini',
  'iron dames': 'lamborghini',
  'proton competition': 'porsche',
  'aston martin aramco': 'aston-martin',
  'mercedes-amg petronas': 'mercedes-benz',
  'mclaren f1 team': 'mclaren',
  'williams racing': 'williams',
  'stake f1 team': 'kick-sauber',
  'haas f1 team': 'haas',
  'visa cash app rb': 'racing-bulls',
};

/**
 * Normalizes a brand name to a lowercase kebab-case slug for the car logos dataset.
 */
export const normalizeBrandSlug = (brandName: string): string => {
  if (!brandName) return '';
  const cleaned = brandName.trim().toLowerCase();
  if (BRAND_ALIASES[cleaned]) {
    return BRAND_ALIASES[cleaned];
  }
  return cleaned
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

/**
 * Returns a standardized CDN logo URL from filippofilip95/car-logos-dataset.
 * Falls back to customLogo if valid and not a placeholder.
 */
export const getBrandLogoUrl = (brandName: string, customLogo?: string | null): string => {
  // If customLogo is a real non-example URL, allow using it if needed
  if (customLogo && !customLogo.includes('example.com') && customLogo.startsWith('http')) {
    return customLogo;
  }
  const slug = normalizeBrandSlug(brandName);
  if (!slug) return '';
  return `https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/${slug}.png`;
};

// Memory cache for car image URLs to ensure instant loading without duplicate network calls
const carImageCache = new Map<string, string | null>();

/**
 * Dynamically resolves an official high-resolution image for any car via public API (Wikipedia / Wikimedia Commons).
 * Resolves automatically according to brand, name and year so any new car added gets its image.
 * Returns the image URL or null if not found (allowing the showroom silhouette fallback).
 */
export const resolveCarImageUrl = async (
  brandName: string,
  modelName: string,
  year?: number | null
): Promise<string | null> => {
  if (!modelName) return null;

  const cacheKey = `${brandName.toLowerCase().trim()}_${modelName.toLowerCase().trim()}_${year || ''}`;
  if (carImageCache.has(cacheKey)) {
    return carImageCache.get(cacheKey)!;
  }

  // Check localStorage for persisted cache
  try {
    const cached = localStorage.getItem(`car_img_${cacheKey}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      carImageCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch {}

  const queries = [
    `${brandName} ${modelName}`,
    `${brandName} ${modelName} ${year || ''}`.trim(),
    modelName,
  ];

  for (const query of queries) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(
        query
      )}&gsrlimit=1&pithumbsize=1000`;

      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();
      const pages = data.query?.pages;
      if (pages) {
        const page = Object.values(pages)[0] as { thumbnail?: { source?: string } };
        if (page.thumbnail?.source) {
          const imgUrl = page.thumbnail.source;
          carImageCache.set(cacheKey, imgUrl);
          try {
            localStorage.setItem(`car_img_${cacheKey}`, JSON.stringify(imgUrl));
          } catch {}
          return imgUrl;
        }
      }
    } catch {
      // Continue to next query if network/parsing error
    }
  }

  carImageCache.set(cacheKey, null);
  return null;
};

/**
 * Dynamically resolves an official logo for a racing team.
 * Checks the CDN car logos dataset (including racing team aliases) first,
 * and falls back to Wikipedia / Wikimedia Commons search.
 */
export const resolveTeamLogoUrl = async (teamName: string): Promise<string | null> => {
  if (!teamName || !teamName.trim()) return null;
  const cleaned = teamName.trim();

  // 1. Try canonical brand/team slug on CDN
  const cdnUrl = getBrandLogoUrl(cleaned);
  if (cdnUrl) {
    try {
      const isAvailable = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = cdnUrl;
      });
      if (isAvailable) return cdnUrl;
    } catch {}
  }

  // 2. Try Wikipedia / Wikimedia search for official racing team logo
  const queries = [
    `${cleaned} racing logo`,
    `${cleaned} logo`,
    cleaned,
  ];

  for (const query of queries) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(
        query
      )}&gsrlimit=1&pithumbsize=1000`;
      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();
      const pages = data.query?.pages;
      if (pages) {
        const page = Object.values(pages)[0] as { thumbnail?: { source?: string } };
        if (page?.thumbnail?.source) {
          return page.thumbnail.source;
        }
      }
    } catch {}
  }

  return null;
};

/**
 * Dynamically resolves an official portrait/photo for a racing driver via Wikipedia / Wikimedia Commons.
 */
export const resolvePilotPhotoUrl = async (pilotName: string): Promise<string | null> => {
  if (!pilotName || !pilotName.trim()) return null;
  const cleaned = pilotName.trim();

  const queries = [
    `${cleaned} racing driver`,
    cleaned,
    `${cleaned} driver`,
    `${cleaned} motorsport`,
  ];

  for (const query of queries) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(
        query
      )}&gsrlimit=1&pithumbsize=1000`;
      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();
      const pages = data.query?.pages;
      if (pages) {
        const page = Object.values(pages)[0] as { thumbnail?: { source?: string } };
        if (page?.thumbnail?.source) {
          return page.thumbnail.source;
        }
      }
    } catch {}
  }

  return null;
};
