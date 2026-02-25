import { VideosContent } from './MyVideosContent';

interface PageProps {
  searchParams: Promise<{ mine?: string }>;
}

export default async function VideosPage({ searchParams }: PageProps) {
  const { mine } = await searchParams;
  return <VideosContent defaultMine={mine === '1'} />;
}
