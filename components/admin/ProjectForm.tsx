'use client';

import { useActionState, useState } from 'react';
import type { Project, Tag } from '@/lib/types';
import type { AppLocale } from '@/i18n/routing';
import { createProject, updateProject, type ProjectFormState } from '@/lib/actions/projects';
import { slugify } from '@/lib/slugify';
import { TagsEditor } from './TagsEditor';
import { LinksEditor } from './LinksEditor';
import { ImageField } from './ImageField';
import { PdfField } from './PdfField';

const inputClass =
  'rounded-xl border border-hairline bg-surface px-3.5 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-accent';

export function ProjectForm({
  locale,
  allTags,
  project,
}: {
  locale: AppLocale;
  allTags: Tag[];
  project?: Project;
}) {
  const action = project
    ? updateProject.bind(null, Number(project.id), locale)
    : createProject.bind(null, locale);
  const [state, formAction, pending] = useActionState<ProjectFormState, FormData>(action, {});

  const [slug, setSlug] = useState(project?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(project));

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          Título (PT)
          <input name="titlePt" defaultValue={project?.titlePt} required className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Title (EN)
          <input
            name="titleEn"
            defaultValue={project?.titleEn}
            required
            className={inputClass}
            onChange={(event) => {
              if (!slugTouched) setSlug(slugify(event.target.value));
            }}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          Descrição (PT)
          <textarea
            name="descriptionPt"
            defaultValue={project?.descriptionPt}
            rows={3}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Description (EN)
          <textarea
            name="descriptionEn"
            defaultValue={project?.descriptionEn}
            rows={3}
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_auto]">
        <label className="flex flex-col gap-1.5 text-sm">
          Slug
          <input
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Tipo
          <select name="type" defaultValue={project?.type ?? 'design'} className={inputClass}>
            <option value="design">Design</option>
            <option value="code">Código</option>
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
          <input
            type="checkbox"
            name="published"
            defaultChecked={project?.published ?? true}
            className="h-4 w-4"
          />
          Publicado
        </label>
      </div>

      <ImageField name="cover" label="Capa" existingUrl={project?.coverImageUrl} />

      <PdfField
        name="pdf"
        label="PDF do projeto"
        existingUrl={project?.pdfUrl}
        existingPageCount={project?.pdfPageCount}
      />

      <div>
        <p className="mb-2 text-sm font-medium text-foreground/80">Links</p>
        <LinksEditor
          initialLinks={
            project?.links.map((link) => ({ label: link.label, url: link.url, type: link.type })) ??
            []
          }
        />
      </div>

      <TagsEditor allTags={allTags} initialSelectedIds={project?.tags.map((tag) => tag.id) ?? []} />


      {state.error && <p className="text-sm text-red-500">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  );
}
