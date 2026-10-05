import { useEffect, useState } from 'react';

import { LoadingState } from '../../components/ui/loading-state';
import { StatusMessage } from '../../components/ui/status-message';
import { ApiError } from '../../lib/api-error';
import { listLinks } from '../links/links-api';
import type { ShortLink } from '../links/link-types';
import { CreateLinkForm } from './create-link-form';
import { RecentLinks } from './recent-links';

export function DashboardPage() {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    listLinks()
      .then((loadedLinks) => {
        if (active) setLinks(loadedLinks);
      })
      .catch((error) => {
        if (active) {
          setLoadError(
            error instanceof ApiError
              ? error.message
              : 'Could not load your recent links.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mx-auto max-w-6xl" aria-labelledby="dashboard-heading">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet">
        Workspace
      </p>
      <h1
        id="dashboard-heading"
        className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-ink"
      >
        Shorten a link
      </h1>
      <CreateLinkForm
        onCreated={(link) => setLinks((current) => [link, ...current])}
      />
      {loadError ? (
        <div className="mt-6">
          <StatusMessage tone="error" title="Recent links unavailable">
            {loadError}
          </StatusMessage>
        </div>
      ) : null}
      {loading ? (
        <LoadingState label="Loading recent links" />
      ) : (
        <RecentLinks links={links} />
      )}
    </section>
  );
}
