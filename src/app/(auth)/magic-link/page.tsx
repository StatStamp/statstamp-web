import { MagicLinkContent } from './MagicLinkContent';

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function MagicLinkPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  return <MagicLinkContent token={token ?? null} />;
}
