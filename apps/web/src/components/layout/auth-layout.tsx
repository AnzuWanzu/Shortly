import type { ReactNode } from 'react';
import { Link2, ShieldCheck, Sparkles } from 'lucide-react';

import { Brand } from './brand';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-canvas px-4 py-6 sm:px-6 lg:grid lg:place-items-center lg:px-10">
      <section className="mx-auto grid min-h-[min(760px,calc(100vh-3rem))] w-full max-w-6xl overflow-hidden border border-line bg-surface shadow-panel lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden overflow-hidden border-r border-line bg-violet-soft p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-y-0 left-0 w-2 bg-violet" aria-hidden />
          <Brand />
          <div className="max-w-sm">
            <div className="mb-8 grid size-24 place-items-center border border-violet bg-surface text-violet shadow-panel">
              <Link2 className="size-11" strokeWidth={1.5} aria-hidden />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet">
              One link, less friction
            </p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] text-ink">
              Keep useful destinations within reach.
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
              Shorten, organize, and revisit the links that matter without a crowded workspace.
            </p>
          </div>
          <div className="flex gap-6 text-xs font-medium text-muted">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-violet" aria-hidden /> Secure sessions
            </span>
            <span className="inline-flex items-center gap-2">
              <Sparkles className="size-4 text-violet" aria-hidden /> Clean workflow
            </span>
          </div>
        </aside>
        <div className="flex min-h-[680px] items-center justify-center px-6 py-10 sm:px-12 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <Brand />
            </div>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
