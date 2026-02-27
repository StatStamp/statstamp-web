import { TeamDetailContent } from './TeamDetailContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <TeamDetailContent id={id} />;
}
