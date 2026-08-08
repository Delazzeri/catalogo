import { notFound } from 'next/navigation';
import { AccentScope } from '@/components/AccentScope';
import { PdfModal } from '@/components/PdfModal';
import { PdfViewerLoader } from '@/components/PdfViewerLoader';
import { getProjectBySlug } from '@/lib/data/projects';

export default async function AllProjectModal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project || !project.pdfUrl) notFound();

  return (
    <AccentScope section="all">
      <PdfModal layoutId={`project-cover-${project.id}`}>
        <PdfViewerLoader project={project} />
      </PdfModal>
    </AccentScope>
  );
}
