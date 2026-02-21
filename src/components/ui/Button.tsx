import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'ghost';
}

export function Button({
  children,
  isLoading,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50';

  const variants: Record<string, string> = {
    primary:
      'bg-zinc-900 text-white hover:bg-zinc-700 focus:ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:focus:ring-zinc-100',
    ghost:
      'bg-transparent text-zinc-700 hover:bg-zinc-100 focus:ring-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:ring-zinc-700',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? 'Loading…' : children}
    </button>
  );
}
