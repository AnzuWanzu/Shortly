import type { ReactNode } from 'react';
import { Link2 } from 'lucide-react';

import { Brand } from './brand';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-canvas px-4 py-6 sm:px-6 lg:grid lg:place-items-center lg:px-10">
      <section className="mx-auto grid min-h-[min(760px,calc(100vh-3rem))] w-full max-w-6xl overflow-hidden border border-line bg-surface shadow-panel lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden overflow-hidden border-r border-line bg-violet-soft p-12 lg:flex lg:flex-col lg:justify-between">
          <div
            className="absolute inset-y-0 left-0 w-2 bg-violet"
            aria-hidden
          />
          <Brand />
          <div className="max-w-sm">
            <div className="mb-8 grid size-24 place-items-center border border-violet bg-surface text-violet shadow-panel">
              <Link2 className="size-11" strokeWidth={1.5} aria-hidden />
            </div>
            <h2 className="text-4xl font-semibold leading-tight tracking-[-0.04em] text-ink">
              One Link, Shorten that Bitch
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
              Paste the long-ass URL. Get a short one. That&apos;s it.
            </p>
          </div>
          <div aria-hidden />
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
