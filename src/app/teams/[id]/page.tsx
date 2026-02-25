import { TeamContent } from './TeamContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamPage({ params }: PageProps) {
  const { id } = await params;
  return <TeamContent id={id} />;
}
