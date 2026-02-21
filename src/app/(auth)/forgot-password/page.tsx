'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForgotPassword } from '@/hooks/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    forgotPassword.mutate({ email });
  }

  if (forgotPassword.isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          If an account with that email exists, we&apos;ve sent a reset link. Check your inbox.
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Reset your password</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          We&apos;ll send a reset link to your email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {forgotPassword.error && (
          <p className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {forgotPassword.error.message}
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

        <Button type="submit" isLoading={forgotPassword.isPending}>
          Send reset link
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        <Link
          href="/login"
          className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
