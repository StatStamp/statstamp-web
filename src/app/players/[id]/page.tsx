import { PlayerContent } from './PlayerContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerPage({ params }: PageProps) {
  const { id } = await params;
  return <PlayerContent id={id} />;
}
