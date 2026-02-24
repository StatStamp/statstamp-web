import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TagPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-50 dark:bg-zinc-950 gap-4">
      <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Stat Taker</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Coming soon.</p>
      <Link
        href={`/breakdowns/${id}`}
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        ← Back to breakdown
      </Link>
    </div>
  );
}
