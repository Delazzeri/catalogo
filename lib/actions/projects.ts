'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { redirect } from '@/i18n/navigation';
import { slugify } from '@/lib/slugify';
import {
  projectFieldsSchema,
  linksArraySchema,
  newTagsArraySchema,
  pdfMetaSchema,
} from '@/lib/validation/project';
import type { AppLocale } from '@/i18n/routing';

export type ProjectFormState = { error?: string };

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function parseFields(formData: FormData) {
  return projectFieldsSchema.parse({
    titlePt: formData.get('titlePt'),
    titleEn: formData.get('titleEn'),
    descriptionPt: formData.get('descriptionPt') || '',
    descriptionEn: formData.get('descriptionEn') || '',
    slug: formData.get('slug'),
    type: formData.get('type'),
    published: formData.get('published') === 'on',
  });
}

async function uploadImage(
  supabase: SupabaseServerClient,
  projectId: number,
  folder: 'cover' | 'banner',
  file: File,
): Promise<string> {
  const path = `${projectId}/${folder}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from('project-media')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const {
    data: { publicUrl },
  } = supabase.storage.from('project-media').getPublicUrl(path);
  return publicUrl;
}

async function uploadPdf(
  supabase: SupabaseServerClient,
  projectId: number,
  file: File,
): Promise<string> {
  const path = `${projectId}/pdf/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from('project-media')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const {
    data: { publicUrl },
  } = supabase.storage.from('project-media').getPublicUrl(path);
  return publicUrl;
}

function parsePdfMeta(formData: FormData, name: string) {
  return pdfMetaSchema.parse({
    pageCount: formData.get(`${name}PageCount`) || undefined,
    aspectRatio: formData.get(`${name}AspectRatio`) || undefined,
  });
}

async function syncTagsAndLinks(
  supabase: SupabaseServerClient,
  projectId: number,
  formData: FormData,
) {
  const links = linksArraySchema.parse(JSON.parse(String(formData.get('links') || '[]')));
  await supabase.from('project_links').delete().eq('project_id', projectId);
  if (links.length > 0) {
    await supabase.from('project_links').insert(
      links.map((link, index) => ({
        project_id: projectId,
        label: link.label,
        url: link.url,
        type: link.type,
        position: index,
      })),
    );
  }

  const selectedTagIds = JSON.parse(String(formData.get('selectedTagIds') || '[]')) as string[];
  const newTags = newTagsArraySchema.parse(JSON.parse(String(formData.get('newTags') || '[]')));

  const createdIds: string[] = [];
  for (const tag of newTags) {
    const { data, error } = await supabase
      .from('tags')
      .insert({
        slug: slugify(tag.nameEn || tag.namePt),
        name_pt: tag.namePt,
        name_en: tag.nameEn,
        category: tag.category,
      })
      .select('id')
      .single();
    if (error) throw error;
    createdIds.push(String(data.id));
  }

  const allTagIds = [...selectedTagIds, ...createdIds];
  await supabase.from('project_tags').delete().eq('project_id', projectId);
  if (allTagIds.length > 0) {
    await supabase
      .from('project_tags')
      .insert(allTagIds.map((tagId) => ({ project_id: projectId, tag_id: Number(tagId) })));
  }
}

function friendlyError(message: string): string {
  if (message.includes('duplicate key') && message.includes('slug')) {
    return 'Esse slug já está em uso por outro projeto.';
  }
  return message;
}

export async function createProject(
  locale: AppLocale,
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const supabase = await createClient();

  let fields;
  try {
    fields = parseFields(formData);
  } catch {
    return { error: 'Confira os campos obrigatórios e o formato do slug.' };
  }

  const { data: inserted, error: insertError } = await supabase
    .from('projects')
    .insert({
      title_pt: fields.titlePt,
      title_en: fields.titleEn,
      description_pt: fields.descriptionPt,
      description_en: fields.descriptionEn,
      slug: fields.slug,
      type: fields.type,
      published: fields.published,
    })
    .select('id')
    .single();

  if (insertError) return { error: friendlyError(insertError.message) };
  const projectId = inserted.id as number;

  const cover = formData.get('cover') as File | null;
  const banner = formData.get('banner') as File | null;
  const pdf = formData.get('pdf') as File | null;

  const mediaUpdates: Record<string, string | number | null> = {};
  if (cover && cover.size > 0)
    mediaUpdates.cover_image_url = await uploadImage(supabase, projectId, 'cover', cover);
  if (banner && banner.size > 0)
    mediaUpdates.banner_image_url = await uploadImage(supabase, projectId, 'banner', banner);
  if (pdf && pdf.size > 0) {
    mediaUpdates.pdf_url = await uploadPdf(supabase, projectId, pdf);
    const pdfMeta = parsePdfMeta(formData, 'pdf');
    mediaUpdates.pdf_page_count = pdfMeta.pageCount ?? null;
    mediaUpdates.pdf_page_aspect_ratio = pdfMeta.aspectRatio ?? null;
  }
  if (Object.keys(mediaUpdates).length > 0) {
    await supabase.from('projects').update(mediaUpdates).eq('id', projectId);
  }

  await syncTagsAndLinks(supabase, projectId, formData);

  revalidatePath('/[locale]/admin', 'page');
  revalidatePath('/[locale]/design', 'page');
  revalidatePath('/[locale]/code', 'page');
  revalidatePath('/[locale]/all', 'page');
  return redirect({ href: '/admin', locale });
}

export async function updateProject(
  id: number,
  locale: AppLocale,
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const supabase = await createClient();

  let fields;
  try {
    fields = parseFields(formData);
  } catch {
    return { error: 'Confira os campos obrigatórios e o formato do slug.' };
  }

  const { error: updateError } = await supabase
    .from('projects')
    .update({
      title_pt: fields.titlePt,
      title_en: fields.titleEn,
      description_pt: fields.descriptionPt,
      description_en: fields.descriptionEn,
      slug: fields.slug,
      type: fields.type,
      published: fields.published,
    })
    .eq('id', id);

  if (updateError) return { error: friendlyError(updateError.message) };

  const cover = formData.get('cover') as File | null;
  const banner = formData.get('banner') as File | null;
  const pdf = formData.get('pdf') as File | null;

  const mediaUpdates: Record<string, string | number | null> = {};
  if (cover && cover.size > 0)
    mediaUpdates.cover_image_url = await uploadImage(supabase, id, 'cover', cover);
  if (banner && banner.size > 0)
    mediaUpdates.banner_image_url = await uploadImage(supabase, id, 'banner', banner);
  if (pdf && pdf.size > 0) {
    mediaUpdates.pdf_url = await uploadPdf(supabase, id, pdf);
    const pdfMeta = parsePdfMeta(formData, 'pdf');
    mediaUpdates.pdf_page_count = pdfMeta.pageCount ?? null;
    mediaUpdates.pdf_page_aspect_ratio = pdfMeta.aspectRatio ?? null;
  }
  if (Object.keys(mediaUpdates).length > 0) {
    await supabase.from('projects').update(mediaUpdates).eq('id', id);
  }

  await syncTagsAndLinks(supabase, id, formData);

  revalidatePath('/[locale]/admin', 'page');
  revalidatePath('/[locale]/design', 'page');
  revalidatePath('/[locale]/code', 'page');
  revalidatePath('/[locale]/all', 'page');
  return redirect({ href: '/admin', locale });
}

async function deleteProjectStorage(projectId: number) {
  const client = createServiceRoleClient();
  const folders = ['cover', 'banner', 'pdf'] as const;
  const paths: string[] = [];

  for (const folder of folders) {
    const { data } = await client.storage.from('project-media').list(`${projectId}/${folder}`);
    if (data) paths.push(...data.map((file) => `${projectId}/${folder}/${file.name}`));
  }

  if (paths.length > 0) await client.storage.from('project-media').remove(paths);
}

export async function deleteProject(id: number, locale: AppLocale) {
  const supabase = await createClient();
  await supabase.from('projects').delete().eq('id', id);
  await deleteProjectStorage(id);

  revalidatePath('/[locale]/admin', 'page');
  revalidatePath('/[locale]/design', 'page');
  revalidatePath('/[locale]/code', 'page');
  revalidatePath('/[locale]/all', 'page');
  return redirect({ href: '/admin', locale });
}

export async function reorderProjects(orderedIds: number[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('projects').update({ position: index }).eq('id', id),
    ),
  );
  revalidatePath('/[locale]/admin', 'page');
  revalidatePath('/[locale]/design', 'page');
  revalidatePath('/[locale]/code', 'page');
  revalidatePath('/[locale]/all', 'page');
}
