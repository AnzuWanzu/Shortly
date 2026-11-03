import { Link2 } from 'lucide-react';
import { Link } from 'react-router';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 font-semibold tracking-tight text-ink"
      aria-label="Shortly home"
    >
      <span className="grid size-8 place-items-center border border-violet bg-violet text-white">
        <Link2 className="size-4" aria-hidden />
      </span>
      {compact ? null : <span>Shortly</span>}
    </Link>
  );
}
