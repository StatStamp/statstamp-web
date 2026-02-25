import { CollectionContent } from './CollectionContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CollectionPage({ params }: PageProps) {
  const { id } = await params;
  return <CollectionContent id={id} />;
}
