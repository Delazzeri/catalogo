'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function PdfPageBackButton({ href }: { href: string }) {
  const t = useTranslations('Common');

  return (
    <Link
      href={href}
      aria-label={t('back')}
      className="fixed left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </Link>
  );
}
