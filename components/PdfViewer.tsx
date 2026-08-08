'use client';

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const FALLBACK_ASPECT_RATIO = 1 / 1.414; // A4 portrait, width/height

function PdfPageSkeleton({ aspectRatio }: { aspectRatio: number }) {
  return (
    <div
      className="w-full animate-pulse bg-surface-solid"
      style={{ aspectRatio: `${aspectRatio}` }}
    />
  );
}

function PdfPage({
  pdf,
  pageNumber,
  fallbackAspectRatio,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  fallbackAspectRatio: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(fallbackAspectRatio);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '800px 0px' },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || isRendered) return;
    let cancelled = false;

    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;

      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const unscaledViewport = page.getViewport({ scale: 1 });
      setAspectRatio(unscaledViewport.width / unscaledViewport.height);

      const cssWidth = container.clientWidth;
      const devicePixelRatio = window.devicePixelRatio || 1;
      const scale = (cssWidth / unscaledViewport.width) * devicePixelRatio;
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssWidth / (unscaledViewport.width / unscaledViewport.height)}px`;

      const context = canvas.getContext('2d');
      if (!context) return;

      await page.render({ canvas, canvasContext: context, viewport }).promise;
      if (!cancelled) setIsRendered(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isVisible, isRendered, pdf, pageNumber]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ aspectRatio: `${aspectRatio}` }}>
      {!isRendered && (
        <div className="absolute inset-0">
          <PdfPageSkeleton aspectRatio={aspectRatio} />
        </div>
      )}
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
}

export function PdfViewer({
  url,
  pageCount,
  pageAspectRatio,
}: {
  url: string;
  pageCount: number | null;
  pageAspectRatio: number | null;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState(false);
  const fallbackAspectRatio = pageAspectRatio ?? FALLBACK_ASPECT_RATIO;

  useEffect(() => {
    let cancelled = false;
    pdfjsLib
      .getDocument({ url })
      .promise.then((doc) => {
        if (!cancelled) setPdf(doc);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-foreground/60">
        Não foi possível carregar o PDF.
      </div>
    );
  }

  if (!pdf) {
    const skeletonCount = pageCount ?? 1;
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <PdfPageSkeleton key={index} aspectRatio={fallbackAspectRatio} />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-2">
      {Array.from({ length: pdf.numPages }).map((_, index) => (
        <PdfPage
          key={index}
          pdf={pdf}
          pageNumber={index + 1}
          fallbackAspectRatio={fallbackAspectRatio}
        />
      ))}
    </div>
  );
}
