import { PlayerDetailContent } from './PlayerDetailContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <PlayerDetailContent id={id} />;
}
