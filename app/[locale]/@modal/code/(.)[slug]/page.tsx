import { notFound } from 'next/navigation';
import { AccentScope } from '@/components/AccentScope';
import { PdfModal } from '@/components/PdfModal';
import { PdfViewerLoader } from '@/components/PdfViewerLoader';
import { getProjectBySlug } from '@/lib/data/projects';

export default async function CodeProjectModal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug, 'code');
  if (!project || !project.pdfUrl) notFound();

  return (
    <AccentScope section="code">
      <PdfModal layoutId={`project-cover-${project.id}`}>
        <PdfViewerLoader project={project} />
      </PdfModal>
    </AccentScope>
  );
}
