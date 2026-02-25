import { EditVideoContent } from './EditVideoContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVideoPage({ params }: PageProps) {
  const { id } = await params;
  return <EditVideoContent id={id} />;
}
