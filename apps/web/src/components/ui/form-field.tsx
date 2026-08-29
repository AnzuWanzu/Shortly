import type { ReactNode } from 'react';

export function FormField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium text-ink" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && !error ? <p className="text-xs leading-5 text-muted">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
