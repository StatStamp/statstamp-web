import { ResetPasswordForm } from './ResetPasswordForm';

interface PageProps {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token = '', email = '' } = await searchParams;
  return <ResetPasswordForm token={token} email={email} />;
}
