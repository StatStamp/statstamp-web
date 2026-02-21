'use client';

import Link from 'next/link';
import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useVerifyEmail } from '@/hooks/auth';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const verifyEmail = useVerifyEmail();
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (token && !hasAttempted.current) {
      hasAttempted.current = true;
      verifyEmail.mutate({ token });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Invalid verification link.</p>
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
    <div className="space-y-4 text-center">
      <h2 className="text-lg font-semibold">Verify your email</h2>

      {verifyEmail.isPending && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Verifying…</p>
      )}

      {verifyEmail.isSuccess && (
        <div className="space-y-4">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Your email has been verified. You can now sign in.
          </p>
          <Link
            href="/login"
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
          >
            Sign in
          </Link>
        </div>
      )}

      {verifyEmail.error && (
        <div className="space-y-4">
          <p className="text-sm text-red-600 dark:text-red-400">{verifyEmail.error.message}</p>
          <Link
            href="/login"
            className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
