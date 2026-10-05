import { AlertTriangle, LoaderCircle } from 'lucide-react';

import { Button } from '../../components/ui/button';
import type { ShortLink } from './link-types';

export function DeleteLinkDialog({
  link,
  deleting,
  onCancel,
  onConfirm,
}: {
  link: ShortLink;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleting) onCancel();
      }}
    >
      <section
        className="w-full max-w-md border border-line bg-surface p-6 shadow-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-link-title"
      >
        <span className="grid size-10 place-items-center bg-danger-soft text-danger">
          <AlertTriangle className="size-5" aria-hidden />
        </span>
        <h2
          id="delete-link-title"
          className="mt-5 text-xl font-semibold text-ink"
        >
          Delete this link?
        </h2>
        <p className="mt-2 break-all text-sm leading-6 text-muted">
          {link.originalUrl}
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          The short URL will stop working. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={deleting}>
            Keep link
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : null}
            {deleting ? 'Deleting' : 'Confirm delete'}
          </Button>
        </div>
      </section>
    </div>
  );
}
