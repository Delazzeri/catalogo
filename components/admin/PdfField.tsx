'use client';

import { useState } from 'react';

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function PdfField({
  name,
  label,
  existingUrl,
  existingPageCount,
}: {
  name: string;
  label: string;
  existingUrl?: string | null;
  existingPageCount?: number | null;
}) {
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(existingPageCount ?? null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [extracting, setExtracting] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileInfo({ name: file.name, size: file.size });
    setExtracting(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 });
      setPageCount(pdf.numPages);
      setAspectRatio(viewport.width / viewport.height);
    } catch {
      setPageCount(null);
      setAspectRatio(null);
    } finally {
      setExtracting(false);
    }
  }

  const existingFileName = existingUrl?.split('/').pop();

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label}
      {(fileInfo || existingFileName) && (
        <p className="text-xs text-foreground/60">
          {fileInfo ? `${fileInfo.name} (${formatFileSize(fileInfo.size)})` : existingFileName}
          {extracting && ' — lendo…'}
          {!extracting && pageCount !== null && ` — ${pageCount} páginas`}
        </p>
      )}
      <input
        type="file"
        name={name}
        accept="application/pdf"
        onChange={handleFileChange}
        className="text-sm text-foreground/70"
      />
      <input type="hidden" name={`${name}PageCount`} value={pageCount ?? ''} />
      <input type="hidden" name={`${name}AspectRatio`} value={aspectRatio ?? ''} />
    </label>
  );
}
