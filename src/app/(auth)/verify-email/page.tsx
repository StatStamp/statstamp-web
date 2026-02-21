import { VerifyEmailContent } from './VerifyEmailContent';

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  return <VerifyEmailContent token={token ?? null} />;
}
