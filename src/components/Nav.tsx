'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLogout } from '@/hooks/auth';
import { AppLogo } from './AppLogo';

const navLinkClass =
  'flex items-center px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors';

export function Nav() {
  const { user, clearAuth } = useAuth();
  const logout = useLogout();

  function handleLogout() {
    logout.mutate(undefined, { onSettled: () => clearAuth() });
  }

  return (
    <nav className="flex flex-col w-56 shrink-0 h-screen border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="px-4 py-5 border-b border-zinc-200 dark:border-zinc-800">
        <Link href="/" className="block">
          <AppLogo />
        </Link>
      </div>

      <div className="flex-1" />

      <div className="p-3 space-y-1 border-t border-zinc-200 dark:border-zinc-800">
        {user ? (
          <>
            <p className="px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              Hello, {user.name}
            </p>
            <button
              onClick={handleLogout}
              disabled={logout.isPending}
              className={navLinkClass + ' w-full text-left'}
            >
              {logout.isPending ? 'Logging out…' : 'Log Out'}
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className={navLinkClass}>
              Log In
            </Link>
            <Link href="/register" className={navLinkClass}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
