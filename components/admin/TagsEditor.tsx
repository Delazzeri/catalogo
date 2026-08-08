'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Tag, TagCategory } from '@/lib/types';
import { pickLocale } from '@/lib/localized-field';
import type { AppLocale } from '@/i18n/routing';
import { deleteTopicTag } from '@/lib/actions/tags';

type PendingTag = { namePt: string; nameEn: string; category: TagCategory };

function TagCategoryEditor({
  tags,
  selected,
  onToggle,
  onDelete,
  pending,
  onAddPending,
  locale,
  placeholderPt,
  placeholderEn,
  addLabel,
}: {
  tags: Tag[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  pending: PendingTag[];
  onAddPending: (namePt: string, nameEn: string) => void;
  locale: AppLocale;
  placeholderPt: string;
  placeholderEn: string;
  addLabel: string;
}) {
  const [newPt, setNewPt] = useState('');
  const [newEn, setNewEn] = useState('');
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selected.has(tag.id);
          return (
            <span
              key={tag.id}
              data-selected={isSelected}
              className="group flex items-center gap-1.5 rounded-full border border-hairline pl-3 pr-1.5 py-1.5 text-sm text-foreground/70 transition-colors data-[selected=true]:border-accent data-[selected=true]:bg-accent data-[selected=true]:text-white"
            >
              <button type="button" onClick={() => onToggle(tag.id)}>
                {pickLocale(tag.namePt, tag.nameEn, locale)}
              </button>
              <button
                type="button"
                disabled={isPending}
                aria-label="Excluir tag"
                onClick={() => {
                  if (!confirm('Excluir esta tag de seção? Ela será removida de todos os projetos que a usam.'))
                    return;
                  startTransition(() => {
                    deleteTopicTag(Number(tag.id));
                    onDelete(tag.id);
                  });
                }}
                className="flex h-4 w-4 items-center justify-center rounded-full text-current/60 hover:bg-black/10 disabled:opacity-50"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </span>
          );
        })}
        {pending.map((tag, index) => (
          <span key={index} className="rounded-full bg-accent/10 px-3 py-1.5 text-sm text-accent">
            {pickLocale(tag.namePt, tag.nameEn, locale)}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={newPt}
          onChange={(event) => setNewPt(event.target.value)}
          placeholder={placeholderPt}
          className="rounded-xl border border-hairline bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          value={newEn}
          onChange={(event) => setNewEn(event.target.value)}
          placeholder={placeholderEn}
          className="rounded-xl border border-hairline bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="button"
          onClick={() => {
            if (!newPt.trim() || !newEn.trim()) return;
            onAddPending(newPt.trim(), newEn.trim());
            setNewPt('');
            setNewEn('');
          }}
          className="rounded-full border border-hairline px-3 py-1.5 text-sm text-foreground/70 hover:text-foreground"
        >
          {addLabel}
        </button>
      </div>
    </div>
  );
}

function ToolTagPicker({
  tags,
  selected,
  onToggle,
  locale,
}: {
  tags: Tag[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  locale: AppLocale;
}) {
  if (tags.length === 0) {
    return (
      <p className="text-sm text-foreground/50">
        Nenhuma ferramenta cadastrada —{' '}
        <Link href="/admin/tools" className="text-accent hover:underline">
          adicione em Admin → Ferramentas
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const isSelected = selected.has(tag.id);
        const label = pickLocale(tag.namePt, tag.nameEn, locale);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggle(tag.id)}
            data-selected={isSelected}
            className="flex items-center gap-2 rounded-full border border-hairline py-1.5 pl-2 pr-3 text-sm text-foreground/70 transition-colors data-[selected=true]:border-accent data-[selected=true]:bg-accent data-[selected=true]:text-white"
          >
            {tag.iconUrl ? (
              <span className="relative h-5 w-5 shrink-0">
                <Image src={tag.iconUrl} alt="" fill className="object-contain" />
              </span>
            ) : null}
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function TagsEditor({
  allTags,
  initialSelectedIds,
}: {
  allTags: Tag[];
  initialSelectedIds: string[];
}) {
  const locale = useLocale() as AppLocale;
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelectedIds));
  const [pending, setPending] = useState<PendingTag[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addPending(namePt: string, nameEn: string, category: TagCategory) {
    setPending((prev) => [...prev, { namePt, nameEn, category }]);
  }

  function deleteTag(id: string) {
    setDeletedIds((prev) => new Set(prev).add(id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  const topicTags = allTags.filter((tag) => tag.category === 'topic' && !deletedIds.has(tag.id));
  const toolTags = allTags.filter((tag) => tag.category === 'tool');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground/50">
          Tags de seção
        </p>
        <TagCategoryEditor
          tags={topicTags}
          selected={selected}
          onToggle={toggle}
          onDelete={deleteTag}
          pending={pending.filter((tag) => tag.category === 'topic')}
          onAddPending={(pt, en) => addPending(pt, en, 'topic')}
          locale={locale}
          placeholderPt="Nova tag (PT)"
          placeholderEn="New tag (EN)"
          addLabel="+ tag"
        />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground/50">
          Ferramentas usadas
        </p>
        <ToolTagPicker tags={toolTags} selected={selected} onToggle={toggle} locale={locale} />
      </div>
      <input type="hidden" name="selectedTagIds" value={JSON.stringify([...selected])} />
      <input type="hidden" name="newTags" value={JSON.stringify(pending)} />
    </div>
  );
}
