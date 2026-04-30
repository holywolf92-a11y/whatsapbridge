export async function renderPdfFirstPageToDataUrl(
  pdfUrl: string,
  options?: { scale?: number; quality?: number; maxPagesToScan?: number; pageNumber?: number }
): Promise<string> {
  const scale = options?.scale ?? 1.25;
  const quality = options?.quality ?? 0.9;
  const maxPagesToScan = Math.max(1, Math.min(options?.maxPagesToScan ?? 5, 10));

  // pdfjs-dist ships multiple builds; the .mjs build works well with Vite.
  // We keep this dynamic to avoid loading pdfjs for non-PDF candidates.
  const pdfjs: any = await import('pdfjs-dist/build/pdf.mjs');

  // Configure worker (Vite will bundle this asset).
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    // If worker config fails, pdf.js will attempt a fallback.
  }

  const loadingTask = pdfjs.getDocument({ url: pdfUrl });
  const pdf = await loadingTask.promise;

  const chooseBestPage = async (): Promise<number> => {
    if (options?.pageNumber && Number.isFinite(options.pageNumber)) {
      const n = Math.max(1, Math.min(Math.floor(options.pageNumber), pdf.numPages));
      return n;
    }

    const pagesToCheck = Math.min(pdf.numPages, maxPagesToScan);
    if (pagesToCheck <= 1) return 1;

    // Heuristic: render a low-res preview and pick the page with the most "ink" (non-white pixels).
    // This works well when the photo is on page 2/3 rather than page 1.
    const scanScale = 0.6;
    const sampleStride = 40; // sample every N pixels for speed
    let bestPage = 1;
    let bestScore = -1;

    for (let pageNum = 1; pageNum <= pagesToCheck; pageNum++) {
      try {
        const p = await pdf.getPage(pageNum);
        const viewport = p.getViewport({ scale: scanScale });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          try {
            p.cleanup();
          } catch {
            // ignore
          }
          continue;
        }

        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        await p.render({ canvasContext: ctx, viewport }).promise;

        const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const totalPixels = Math.max(1, width * height);
        const step = Math.max(4, sampleStride * 4);
        let sampled = 0;
        let ink = 0;

        // Score: sum of (255 - avgRGB) over sampled pixels
        for (let i = 0; i < data.length; i += step) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const avg = (r + g + b) / 3;
          ink += 255 - avg;
          sampled++;
        }

        const normalized = ink / (255 * Math.max(1, sampled));
        // Penalize pages that are extremely sparse (almost blank)
        const score = normalized * (sampled / totalPixels);

        if (score > bestScore) {
          bestScore = score;
          bestPage = pageNum;
        }

        try {
          p.cleanup();
        } catch {
          // ignore
        }
      } catch {
        // ignore scanning errors and keep going
      }
    }

    return bestPage;
  };

  const pageNumber = await chooseBestPage();
  const page = await pdf.getPage(pageNumber);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to get canvas 2D context');
  }

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({ canvasContext: context, viewport }).promise;

  // Try to release resources
  try {
    page.cleanup();
    pdf.cleanup();
    loadingTask.destroy();
  } catch {
    // ignore
  }

  return canvas.toDataURL('image/jpeg', quality);
}
