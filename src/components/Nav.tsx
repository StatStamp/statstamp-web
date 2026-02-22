'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLogout } from '@/hooks/auth';
import { AppLogo } from './AppLogo';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
        isActive
          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800',
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

const buttonLinkClass =
  'flex items-center px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors';

// ---------------------------------------------------------------------------
// Shared nav items (used in both desktop sidebar and mobile menu)
// ---------------------------------------------------------------------------

function NavItems({ onAction }: { onAction?: () => void }) {
  const { user, clearAuth } = useAuth();
  const logout = useLogout();

  function handleLogout() {
    logout.mutate(undefined, { onSettled: () => clearAuth() });
    onAction?.();
  }

  return (
    <>
      <div className="flex-1 p-3 space-y-1">
        <NavLink href="/" onClick={onAction}>Explore</NavLink>
      </div>

      <div className="p-3 space-y-1 border-t border-zinc-200 dark:border-zinc-800">
        {user ? (
          <>
            <p className="px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              Hello, {user.name}
            </p>
            <button
              onClick={handleLogout}
              disabled={logout.isPending}
              className={buttonLinkClass + ' w-full text-left'}
            >
              {logout.isPending ? 'Logging out…' : 'Log Out'}
            </button>
          </>
        ) : (
          <>
            <NavLink href="/login" onClick={onAction}>Log In</NavLink>
            <NavLink href="/register" onClick={onAction}>Register</NavLink>
          </>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Hamburger / close icons
// ---------------------------------------------------------------------------

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 5h14M3 10h14M3 15h14" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4l12 12M16 4L4 16" strokeWidth="1.5" strokeLinecap="round" className="stroke-current" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Nav
// ---------------------------------------------------------------------------

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile menu on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <>
      {/* ── Desktop sidebar (lg+) ── */}
      <nav className="hidden lg:flex flex-col w-56 shrink-0 h-screen border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="px-4 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/" className="block">
            <AppLogo />
          </Link>
        </div>
        <NavItems />
      </nav>

      {/* ── Mobile top bar (< lg) ── */}
      <nav className="lg:hidden flex items-center justify-between h-14 px-4 shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <Link href="/" className="block">
          <AppLogo />
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          className="rounded-md p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <HamburgerIcon />
        </button>
      </nav>

      {/* ── Mobile full-screen menu ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-900">
          {/* Menu header with logo + close button */}
          <div className="flex items-center justify-between h-14 px-4 shrink-0 border-b border-zinc-200 dark:border-zinc-800">
            <Link href="/" onClick={() => setMobileOpen(false)} className="block">
              <AppLogo />
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className="rounded-md p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Menu content */}
          <div className="flex flex-col flex-1 overflow-y-auto">
            <NavItems onAction={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
