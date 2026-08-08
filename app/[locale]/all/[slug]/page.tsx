import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { AccentScope } from '@/components/AccentScope';
import { PdfViewerLoader } from '@/components/PdfViewerLoader';
import { PdfPageBackButton } from '@/components/PdfPageBackButton';
import { getProjectBySlug } from '@/lib/data/projects';
import { pickLocale } from '@/lib/localized-field';
import type { AppLocale } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  const locale = (await getLocale()) as AppLocale;
  return {
    title: pickLocale(project.titlePt, project.titleEn, locale),
    description: pickLocale(project.descriptionPt, project.descriptionEn, locale),
    openGraph: { images: [project.coverImageUrl] },
  };
}

export default async function AllProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project || !project.pdfUrl) notFound();

  return (
    <AccentScope section="all">
      <PdfPageBackButton href="/all" />
      <PdfViewerLoader project={project} />
    </AccentScope>
  );
}
