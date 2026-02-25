import { EditPlayerContent } from './EditPlayerContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPlayerPage({ params }: PageProps) {
  const { id } = await params;
  return <EditPlayerContent id={id} />;
}
