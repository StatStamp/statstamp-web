'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLogout } from '@/hooks/auth';
import { AppLogo } from './AppLogo';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
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

      <div className="flex-1 p-3 space-y-1">
        <NavLink href="/">Explore</NavLink>
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
            <NavLink href="/login">Log In</NavLink>
            <NavLink href="/register">Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
