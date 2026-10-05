import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Input } from '../../components/ui/input';
import { LoadingState } from '../../components/ui/loading-state';
import { StatusMessage } from '../../components/ui/status-message';
import { ApiError } from '../../lib/api-error';
import { DeleteLinkDialog } from './delete-link-dialog';
import { LinkList } from './link-list';
import type { ShortLink } from './link-types';
import { deleteLink, listLinks } from './links-api';

export function LinksPage() {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<ShortLink | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    listLinks()
      .then((loadedLinks) => {
        if (active) setLinks(loadedLinks);
      })
      .catch((caughtError) => {
        if (active)
          setError(readError(caughtError, 'Could not load your links.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleLinks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return links;
    return links.filter(
      (link) =>
        link.originalUrl.toLowerCase().includes(normalizedQuery) ||
        link.slug.toLowerCase().includes(normalizedQuery),
    );
  }, [links, query]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setError('');
    try {
      await deleteLink(pendingDelete.id);
      setLinks((current) =>
        current.filter((link) => link.id !== pendingDelete.id),
      );
      setPendingDelete(null);
    } catch (caughtError) {
      setError(readError(caughtError, 'Could not delete that link.'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">
        Library
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink">
        Your links
      </h1>
      <div className="mt-7 max-w-md">
        <label className="text-sm font-medium text-ink" htmlFor="link-search">
          Search links
        </label>
        <div className="relative mt-1.5">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            id="link-search"
            type="search"
            className="pl-10"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Original URL or short code"
          />
        </div>
      </div>

      {error ? (
        <div className="mt-6">
          <StatusMessage tone="error" title="Link action failed">
            {error}
          </StatusMessage>
        </div>
      ) : null}

      <div className="mt-6">
        {loading ? (
          <LoadingState label="Loading your links" />
        ) : (
          <LinkList links={visibleLinks} onDelete={setPendingDelete} />
        )}
      </div>

      {pendingDelete ? (
        <DeleteLinkDialog
          link={pendingDelete}
          deleting={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </section>
  );
}

function readError(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}
