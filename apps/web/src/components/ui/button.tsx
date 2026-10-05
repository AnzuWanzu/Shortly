import type { ButtonHTMLAttributes } from 'react';

import { classNames } from '../../lib/class-names';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const variants: Record<ButtonVariant, string> = {
  primary: 'border-violet bg-violet text-white hover:bg-violet-dark',
  secondary:
    'border-line bg-surface text-ink hover:border-violet hover:text-violet',
  danger: 'border-danger bg-danger text-white hover:bg-red-800',
  ghost:
    'border-transparent bg-transparent text-muted hover:bg-violet-soft hover:text-violet',
};

export function Button({
  className,
  variant = 'primary',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={classNames(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
