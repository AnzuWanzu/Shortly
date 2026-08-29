import { Link2, List, LogOut, Menu, Settings, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router';

import { classNames } from '../../lib/class-names';
import { Brand } from './brand';
import { useSession } from '../../app/session-provider';

const navigation = [
  { to: '/', label: 'Shorten link', icon: Link2, end: true },
  { to: '/links', label: 'Link list', icon: List, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

export function ApplicationShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useSession();

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <Brand />
        <button
          type="button"
          className="grid size-11 place-items-center text-ink"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        >
          {menuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
        </button>
      </header>

      <aside
        id="mobile-navigation"
        className={classNames(
          'fixed inset-x-0 top-16 z-20 border-b border-line bg-surface px-4 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-7',
          menuOpen ? 'block' : 'hidden lg:flex',
        )}
      >
        <div className="hidden lg:block">
          <Brand />
        </div>
        <nav className="mt-0 grid gap-1 lg:mt-12" aria-label="Primary navigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                classNames(
                  'flex min-h-11 items-center gap-3 border-l-2 px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-violet bg-violet-soft text-violet'
                    : 'border-transparent text-muted hover:bg-slate-50 hover:text-ink',
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 border-t border-line pt-5 lg:mt-auto">
          <p className="truncate text-sm font-semibold text-ink">
            {user?.displayName}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">{user?.email}</p>
          <span className="mt-4 inline-flex items-center gap-2 text-xs text-muted">
            <LogOut className="size-3.5" aria-hidden /> Logout is available in Settings
          </span>
        </div>
      </aside>

      <main id="main-content" className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <Outlet />
      </main>
    </div>
  );
}
