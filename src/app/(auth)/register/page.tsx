'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRegister } from '@/hooks/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const register = useRegister();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    register.mutate(
      { name, email, password, password_confirmation: passwordConfirmation },
      {
        onSuccess: ({ user, token }) => {
          setAuth(user, token);
          router.push('/');
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Create an account</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          You&apos;ll receive a verification email after signing up.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {register.error && (
          <p className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {register.error.message}
          </p>
        )}

        <Input
          label="Name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Input
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
        />

        <Button type="submit" isLoading={register.isPending}>
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
