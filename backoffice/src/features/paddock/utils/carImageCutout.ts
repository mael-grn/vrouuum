/**
 * AI-Powered Background Removal for Showroom Vehicles
 * Uses a dedicated Web Worker to run neural network inference off the main thread,
 * ensuring 60fps UI responsiveness without freezing the website.
 * Includes IndexedDB persistent caching for instant 0ms subsequent loads.
 */

const DB_NAME = 'vrouuum_media_cache';
const STORE_NAME = 'car_cutouts';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getCachedCutout = async (key: string): Promise<string | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result instanceof Blob) {
          resolve(URL.createObjectURL(req.result));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

export const setCachedCutout = async (key: string, blob: Blob): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(blob, key);
  } catch {}
};

// In-memory cache for Object URLs during the session
const objectUrlCache = new Map<string, string>();
const ongoingJobs = new Map<string, Promise<string>>();

interface WorkerJob {
  resolve: (url: string) => void;
  rawImageUrl: string;
  cacheKey: string;
  timeoutId: ReturnType<typeof setTimeout>;
}

let workerInstance: Worker | null = null;
const pendingWorkerJobs = new Map<string, WorkerJob>();

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!workerInstance) {
    try {
      workerInstance = new Worker(new URL('./cutout.worker.ts', import.meta.url), {
        type: 'module',
      });

      workerInstance.onmessage = async (
        e: MessageEvent<{
          success: boolean;
          cacheKey: string;
          blob?: Blob;
          fallbackUrl?: string;
        }>
      ) => {
        const { success, cacheKey, blob, fallbackUrl } = e.data;
        const job = pendingWorkerJobs.get(cacheKey);
        if (!job) return;

        clearTimeout(job.timeoutId);
        pendingWorkerJobs.delete(cacheKey);

        if (success && blob) {
          try {
            await setCachedCutout(cacheKey, blob);
          } catch {}
          const objectUrl = URL.createObjectURL(blob);
          objectUrlCache.set(cacheKey, objectUrl);
          job.resolve(objectUrl);
        } else {
          job.resolve(fallbackUrl || job.rawImageUrl);
        }
      };

      workerInstance.onerror = () => {
        // Resolve all active jobs with raw image on worker failure
        pendingWorkerJobs.forEach((job) => {
          clearTimeout(job.timeoutId);
          job.resolve(job.rawImageUrl);
        });
        pendingWorkerJobs.clear();
      };
    } catch {
      return null;
    }
  }
  return workerInstance;
}

/**
 * Removes the background of a car image via Web Worker AI,
 * producing a transparent cutout for the showroom stage.
 * Never freezes the main thread.
 */
export const processCarCutout = async (
  cacheKey: string,
  rawImageUrl: string
): Promise<string> => {
  // 1. Check in-memory session cache
  if (objectUrlCache.has(cacheKey)) {
    return objectUrlCache.get(cacheKey)!;
  }

  // 2. Check persistent IndexedDB cache
  const cached = await getCachedCutout(cacheKey);
  if (cached) {
    objectUrlCache.set(cacheKey, cached);
    return cached;
  }

  // 3. Prevent duplicate concurrent runs for the same car
  if (ongoingJobs.has(cacheKey)) {
    return ongoingJobs.get(cacheKey)!;
  }

  const job = new Promise<string>((resolve) => {
    const worker = getWorker();

    if (!worker) {
      // Graceful fallback if Web Workers are unsupported
      resolve(rawImageUrl);
      return;
    }

    // Safety timeout: never hang or block the app
    const timeoutId = setTimeout(() => {
      if (pendingWorkerJobs.has(cacheKey)) {
        pendingWorkerJobs.delete(cacheKey);
        resolve(rawImageUrl);
      }
    }, 12000);

    pendingWorkerJobs.set(cacheKey, {
      resolve: (url: string) => {
        ongoingJobs.delete(cacheKey);
        resolve(url);
      },
      rawImageUrl,
      cacheKey,
      timeoutId,
    });

    worker.postMessage({ cacheKey, imageUrl: rawImageUrl });
  });

  ongoingJobs.set(cacheKey, job);
  return job;
};
