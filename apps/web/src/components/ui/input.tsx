import type { InputHTMLAttributes } from 'react';

import { classNames } from '../../lib/class-names';

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={classNames(
        'min-h-11 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink shadow-sm outline-none placeholder:text-slate-400 focus:border-violet focus:ring-3 focus:ring-violet/15 disabled:bg-slate-100',
        className,
      )}
      {...props}
    />
  );
}
