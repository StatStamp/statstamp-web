import { BreakdownContent } from './BreakdownContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BreakdownPage({ params }: PageProps) {
  const { id } = await params;
  return <BreakdownContent id={id} />;
}
