import { EventTypeContent } from './EventTypeContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventTypePage({ params }: PageProps) {
  const { id } = await params;
  return <EventTypeContent id={id} />;
}
