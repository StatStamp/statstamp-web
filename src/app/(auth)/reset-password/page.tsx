'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useResetPassword } from '@/hooks/auth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const resetPassword = useResetPassword();
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  if (!token || !email) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Invalid reset link.</p>
        <Link
          href="/forgot-password"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetPassword.mutate(
      { token, email, password, password_confirmation: passwordConfirmation },
      { onSuccess: () => router.push('/login') },
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Set a new password</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Must be at least 8 characters.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {resetPassword.error && (
          <p className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {resetPassword.error.message}
          </p>
        )}

        <Input
          label="New password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Input
          label="Confirm new password"
          type="password"
          required
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
        />

        <Button type="submit" isLoading={resetPassword.isPending}>
          Reset password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
