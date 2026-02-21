import { Nav } from '@/components/Nav';

export default function Home() {
  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      <Nav />
      <main className="flex flex-1 items-center justify-center">
        <h1 className="text-2xl font-semibold tracking-tight">StatStamp</h1>
      </main>
    </div>
  );
}
