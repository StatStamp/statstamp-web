import { BreakdownsContent } from './BreakdownsContent';

interface PageProps {
  searchParams: Promise<{ mine?: string }>;
}

export default async function BreakdownsPage({ searchParams }: PageProps) {
  const { mine } = await searchParams;
  return <BreakdownsContent defaultMine={mine === '1'} />;
}
