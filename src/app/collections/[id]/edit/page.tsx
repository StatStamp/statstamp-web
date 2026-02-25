import { EditCollectionContent } from './EditCollectionContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({ params }: PageProps) {
  const { id } = await params;
  return <EditCollectionContent id={id} />;
}
