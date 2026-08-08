'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { redirect } from '@/i18n/navigation';
import { slugify } from '@/lib/slugify';
import { toolTagFieldsSchema } from '@/lib/validation/tag';
import type { AppLocale } from '@/i18n/routing';

export type ToolTagFormState = { error?: string };

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function parseFields(formData: FormData) {
  return toolTagFieldsSchema.parse({
    namePt: formData.get('namePt'),
    nameEn: formData.get('nameEn'),
  });
}

async function uploadToolIcon(
  supabase: SupabaseServerClient,
  pathPrefix: string,
  file: File,
): Promise<string> {
  const path = `tools/${pathPrefix}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from('project-media')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const {
    data: { publicUrl },
  } = supabase.storage.from('project-media').getPublicUrl(path);
  return publicUrl;
}

function revalidateAll() {
  revalidatePath('/[locale]/admin/tools', 'page');
  revalidatePath('/[locale]/admin', 'page');
  revalidatePath('/[locale]/admin/projects/[id]/edit', 'page');
  revalidatePath('/[locale]/design', 'page');
  revalidatePath('/[locale]/code', 'page');
  revalidatePath('/[locale]/all', 'page');
}

export async function createToolTag(
  locale: AppLocale,
  _prevState: ToolTagFormState,
  formData: FormData,
): Promise<ToolTagFormState> {
  const supabase = await createClient();

  let fields;
  try {
    fields = parseFields(formData);
  } catch {
    return { error: 'Confira os campos obrigatórios.' };
  }

  const icon = formData.get('icon') as File | null;
  if (!icon || icon.size === 0) {
    return { error: 'Escolha um ícone para a ferramenta.' };
  }

  let iconUrl: string;
  try {
    iconUrl = await uploadToolIcon(supabase, 'new', icon);
  } catch {
    return { error: 'Falha ao enviar o arquivo. Tente um arquivo menor ou verifique sua conexão.' };
  }

  const { error: insertError } = await supabase.from('tags').insert({
    slug: slugify(fields.nameEn || fields.namePt),
    name_pt: fields.namePt,
    name_en: fields.nameEn,
    category: 'tool',
    icon_url: iconUrl,
  });

  if (insertError) return { error: insertError.message };

  revalidateAll();
  return redirect({ href: '/admin/tools', locale });
}

export async function updateToolTag(
  id: number,
  locale: AppLocale,
  _prevState: ToolTagFormState,
  formData: FormData,
): Promise<ToolTagFormState> {
  const supabase = await createClient();

  let fields;
  try {
    fields = parseFields(formData);
  } catch {
    return { error: 'Confira os campos obrigatórios.' };
  }

  const icon = formData.get('icon') as File | null;
  let iconUrl: string | undefined;
  if (icon && icon.size > 0) {
    try {
      iconUrl = await uploadToolIcon(supabase, String(id), icon);
    } catch {
      return { error: 'Falha ao enviar o arquivo. Tente um arquivo menor ou verifique sua conexão.' };
    }
  }

  const { error: updateError } = await supabase
    .from('tags')
    .update({
      name_pt: fields.namePt,
      name_en: fields.nameEn,
      ...(iconUrl ? { icon_url: iconUrl } : {}),
    })
    .eq('id', id);

  if (updateError) return { error: updateError.message };

  revalidateAll();
  return redirect({ href: '/admin/tools', locale });
}

async function deleteToolTagStorage(tagId: number) {
  const client = createServiceRoleClient();
  const { data } = await client.storage.from('project-media').list(`tools/${tagId}`);
  if (data && data.length > 0) {
    await client.storage
      .from('project-media')
      .remove(data.map((file) => `tools/${tagId}/${file.name}`));
  }
}

export async function deleteToolTag(id: number, locale: AppLocale) {
  const supabase = await createClient();
  await supabase.from('tags').delete().eq('id', id);
  await deleteToolTagStorage(id);

  revalidateAll();
  return redirect({ href: '/admin/tools', locale });
}

export async function deleteTopicTag(id: number) {
  const supabase = await createClient();
  await supabase.from('tags').delete().eq('id', id).eq('category', 'topic');
  revalidateAll();
}
