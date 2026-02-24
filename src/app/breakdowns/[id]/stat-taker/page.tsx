import { StatTakerContent } from './StatTakerContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StatTakerPage({ params }: PageProps) {
  const { id } = await params;
  return <StatTakerContent id={id} />;
}
