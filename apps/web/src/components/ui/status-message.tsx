import type { ReactNode } from 'react';

import { classNames } from '../../lib/class-names';

export function StatusMessage({
  tone,
  title,
  children,
}: {
  tone: 'error' | 'success' | 'neutral';
  title: string;
  children?: ReactNode;
}) {
  return (
    <section
      className={classNames(
        'w-full rounded-lg border px-4 py-3 text-sm',
        tone === 'error' && 'border-red-200 bg-danger-soft text-danger',
        tone === 'success' && 'border-emerald-200 bg-success-soft text-success',
        tone === 'neutral' && 'border-line bg-surface text-muted',
      )}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <p className="font-semibold">{title}</p>
      {children ? <div className="mt-1">{children}</div> : null}
    </section>
  );
}
