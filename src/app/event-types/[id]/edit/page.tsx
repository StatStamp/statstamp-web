import { EditEventTypeContent } from './EditEventTypeContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventTypePage({ params }: PageProps) {
  const { id } = await params;
  return <EditEventTypeContent id={id} />;
}
