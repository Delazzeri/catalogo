'use client';

import dynamic from 'next/dynamic';
import type { Project } from '@/lib/types';

const PdfViewer = dynamic(() => import('./PdfViewer').then((mod) => mod.PdfViewer), {
  ssr: false,
});

export function PdfViewerLoader({ project }: { project: Project }) {
  return (
    <PdfViewer
      url={project.pdfUrl!}
      pageCount={project.pdfPageCount}
      pageAspectRatio={project.pdfPageAspectRatio}
    />
  );
}
