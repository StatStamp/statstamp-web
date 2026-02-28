import { EditTemplateContent } from './EditTemplateContent';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({ params }: PageProps) {
  const { id } = await params;
  return <EditTemplateContent id={id} />;
}
