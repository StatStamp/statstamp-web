import Link from 'next/link';
import { AppLogo } from './AppLogo';

export function Nav() {
  return (
    <nav className="flex flex-col w-56 shrink-0 h-screen border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="px-4 py-5 border-b border-zinc-200 dark:border-zinc-800">
        <Link href="/" className="block">
          <AppLogo />
        </Link>
      </div>

      <div className="flex-1 p-3 space-y-1">
        <Link
          href="/login"
          className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Sign up
        </Link>
      </div>
    </nav>
  );
}
