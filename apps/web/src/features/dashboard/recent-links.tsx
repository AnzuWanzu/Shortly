import { Check, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import { Button } from '../../components/ui/button';
import type { ShortLink } from '../links/link-types';
import { getShortUrl, getShortUrlLabel } from '../links/link-url';

export function RecentLinks({ links }: { links: ShortLink[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(link: ShortLink) {
    await navigator.clipboard.writeText(getShortUrl(link.slug));
    setCopiedId(link.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  }

  return (
    <section className="mt-10" aria-labelledby="recent-links-heading">
      <div className="flex items-center justify-between gap-4">
        <h2
          id="recent-links-heading"
          className="text-lg font-semibold text-ink"
        >
          Recent links
        </h2>
        <Link
          className="text-sm font-semibold text-violet hover:underline"
          to="/links"
        >
          View all
        </Link>
      </div>

      {links.length === 0 ? (
        <div className="mt-4 border border-dashed border-line bg-surface px-5 py-10 text-center">
          <p className="font-medium text-ink">No links yet.</p>
          <p className="mt-1 text-sm text-muted">
            Your latest links will land here.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line border border-line bg-surface">
          {links.slice(0, 3).map((link) => (
            <li
              key={link.id}
              className="grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"
            >
              <div className="min-w-0">
                <a
                  className="font-semibold text-violet hover:underline"
                  href={getShortUrl(link.slug)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {getShortUrlLabel(link.slug)}
                </a>
                <p
                  className="mt-1 truncate text-sm text-muted"
                  title={link.originalUrl}
                >
                  {link.originalUrl}
                </p>
              </div>
              <div className="flex items-center gap-1">
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
                  {copiedId === link.id ? 'Copied' : 'Copy'}
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
