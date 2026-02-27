import { RosterDetailContent } from './RosterDetailContent';

interface PageProps {
  params: Promise<{ id: string; rosterId: string }>;
}

export default async function RosterDetailPage({ params }: PageProps) {
  const { id, rosterId } = await params;
  return <RosterDetailContent teamId={id} rosterId={rosterId} />;
}
