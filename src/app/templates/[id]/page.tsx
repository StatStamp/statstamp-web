import { TemplateContent } from './TemplateContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplatePage({ params }: PageProps) {
  const { id } = await params;
  return <TemplateContent id={id} />;
}
