import { EditTeamContent } from './EditTeamContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTeamPage({ params }: PageProps) {
  const { id } = await params;
  return <EditTeamContent id={id} />;
}
