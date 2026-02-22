import { NewBreakdownContent } from './NewBreakdownContent';

interface PageProps {
  searchParams: Promise<{ video?: string }>;
}

export default async function NewBreakdownPage({ searchParams }: PageProps) {
  const { video } = await searchParams;
  return <NewBreakdownContent initialVideoId={video ?? null} />;
}
