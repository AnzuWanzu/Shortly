import { LoaderCircle } from 'lucide-react';

export function LoadingState({ label }: { label: string }) {
  return (
    <div
      className="grid min-h-56 place-items-center gap-3 text-center text-sm text-muted"
      role="status"
    >
      <LoaderCircle className="size-6 animate-spin text-violet" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
