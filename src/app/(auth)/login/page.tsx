'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/hooks/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate({ email, password }, {
      onSuccess: ({ user, token }) => {
        setAuth(user, token);
        router.push('/');
      },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Sign in</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Welcome back.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {login.error && (
          <p className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {login.error.message}
          </p>
        )}

        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
          />
        </div>

        <Button type="submit" isLoading={login.isPending}>
          Sign in
        </Button>
      </form>

      <div className="space-y-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
        <p>
          <Link
            href="/magic-link"
            className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
          >
            Sign in with a magic link instead
          </Link>
        </p>
        <p>
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
