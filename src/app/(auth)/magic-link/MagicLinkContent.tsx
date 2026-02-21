'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthenticateMagicLink, useRequestMagicLink } from '@/hooks/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Props {
  token: string | null;
}

export function MagicLinkContent({ token }: Props) {
  const router = useRouter();
  const { setAuth } = useAuth();

  const requestMagicLink = useRequestMagicLink();
  const authenticateMagicLink = useAuthenticateMagicLink();
  const hasAttempted = useRef(false);

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (token && !hasAttempted.current) {
      hasAttempted.current = true;
      authenticateMagicLink.mutate(
        { token },
        {
          onSuccess: ({ user, token: apiToken }) => {
            setAuth(user, apiToken);
            router.push('/');
          },
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Token in URL — show authenticating / error state.
  if (token) {
    return (
      <div className="space-y-4 text-center">
        {authenticateMagicLink.isPending && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Signing you in…</p>
        )}
        {authenticateMagicLink.error && (
          <div className="space-y-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              {authenticateMagicLink.error.message}
            </p>
            <Link
              href="/magic-link"
              className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
            >
              Request a new link
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Post-send confirmation.
  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          If an account with that email exists, we&apos;ve sent a sign-in link. Check your inbox.
        </p>
        <Link
          href="/login"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    requestMagicLink.mutate({ email }, { onSuccess: () => setSent(true) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Sign in with a magic link</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          We&apos;ll email you a link to sign in instantly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {requestMagicLink.error && (
          <p className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {requestMagicLink.error.message}
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

        <Button type="submit" isLoading={requestMagicLink.isPending}>
          Send magic link
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        <Link
          href="/login"
          className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
        >
          Sign in with password instead
        </Link>
      </p>
    </div>
  );
}
