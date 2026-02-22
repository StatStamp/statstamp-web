import { VideoContent } from './VideoContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VideoPage({ params }: PageProps) {
  const { id } = await params;
  return <VideoContent id={id} />;
}
