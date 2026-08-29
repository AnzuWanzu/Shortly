import { Check, Copy, ExternalLink, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../../components/ui/button';
import type { ShortLink } from './link-types';
import { getShortUrl, getShortUrlLabel } from './link-url';

export function LinkList({
  links,
  onDelete,
}: {
  links: ShortLink[];
  onDelete: (link: ShortLink) => void;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(link: ShortLink) {
    await navigator.clipboard.writeText(getShortUrl(link.slug));
    setCopiedId(link.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  }

  if (links.length === 0) {
    return (
      <div className="border border-dashed border-line bg-surface px-5 py-12 text-center">
        <p className="font-medium text-ink">Nothing matches.</p>
        <p className="mt-1 text-sm text-muted">
          Try a different URL or short code.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line border border-line bg-surface">
      {links.map((link) => (
        <li
          key={link.id}
          className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(180px,0.7fr)_140px_auto] lg:items-center"
        >
          <div className="min-w-0">
            <p
              className="truncate text-sm font-medium text-ink"
              title={link.originalUrl}
            >
              {link.originalUrl}
            </p>
            <p className="mt-1 text-xs text-muted lg:hidden">
              {formatDate(link.createdAt)}
            </p>
          </div>
          <a
            className="truncate text-sm font-semibold text-violet hover:underline"
            href={getShortUrl(link.slug)}
            target="_blank"
            rel="noreferrer"
          >
            {getShortUrlLabel(link.slug)}
          </a>
          <p className="hidden text-sm text-muted lg:block">
            {formatDate(link.createdAt)}
          </p>
          <div className="flex items-center gap-1 lg:justify-end">
            <Button
              variant="ghost"
              className="min-h-10 px-3"
              onClick={() => void copy(link)}
              aria-label={`Copy ${getShortUrlLabel(link.slug)}`}
            >
              {copiedId === link.id ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
              <span className="sr-only sm:not-sr-only">
                {copiedId === link.id ? 'Copied' : 'Copy'}
              </span>
            </Button>
            <a
              className="grid size-10 place-items-center text-muted hover:text-violet"
              href={getShortUrl(link.slug)}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${getShortUrlLabel(link.slug)}`}
            >
              <ExternalLink className="size-4" aria-hidden />
            </a>
            <Button
              variant="ghost"
              className="min-h-10 px-3 hover:bg-danger-soft hover:text-danger"
              onClick={() => onDelete(link)}
              aria-label={`Delete ${new URL(link.originalUrl).host}${new URL(link.originalUrl).pathname}`}
            >
              <Trash2 className="size-4" aria-hidden />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}
