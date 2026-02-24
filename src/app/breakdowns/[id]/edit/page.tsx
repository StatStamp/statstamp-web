import { EditBreakdownContent } from './EditBreakdownContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBreakdownPage({ params }: PageProps) {
  const { id } = await params;
  return <EditBreakdownContent id={id} />;
}
