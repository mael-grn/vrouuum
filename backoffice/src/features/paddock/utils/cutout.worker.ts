// Web Worker for off-thread AI background removal
// Offloads heavy neural network inference and image resizing from the main UI thread

self.onmessage = async (e: MessageEvent<{ cacheKey: string; imageUrl: string }>) => {
  const { cacheKey, imageUrl } = e.data;

  try {
    const { removeBackground } = await import('@imgly/background-removal');

    const res = await fetch(imageUrl, { mode: 'cors' });
    if (!res.ok) {
      self.postMessage({ success: false, cacheKey, error: 'Fetch failed', fallbackUrl: imageUrl });
      return;
    }

    const blob = await res.blob();

    // Optimize: Downscale image to max 640px before inference
    // This reduces inference time by ~75% while maintaining crisp quality for the showroom tile
    let processBlob: Blob = blob;
    try {
      if (typeof createImageBitmap !== 'undefined' && typeof OffscreenCanvas !== 'undefined') {
        const bmp = await createImageBitmap(blob);
        const maxDim = 640;
        let w = bmp.width;
        let h = bmp.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          const offscreen = new OffscreenCanvas(w, h);
          const ctx = offscreen.getContext('2d');
          if (ctx) {
            ctx.drawImage(bmp, 0, 0, w, h);
            processBlob = await offscreen.convertToBlob({ type: 'image/png' });
          }
        }
      }
    } catch {
      // If downscaling fails, process original blob
      processBlob = blob;
    }

    const cutoutBlob = await removeBackground(processBlob, {
      model: 'isnet_quint8',
      debug: false,
    });

    self.postMessage({ success: true, cacheKey, blob: cutoutBlob });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ success: false, cacheKey, error: message, fallbackUrl: imageUrl });
  }
};
