import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { WebhookLogSection } from '@/components/settings/webhook-log-section';

export default async function WebhooksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const projects = await projectRepository.getByUserId(session.user.id);
  const project = projects[0] ?? null;

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <h1 className="text-foreground text-lg font-semibold">WEBHOOK DELIVERY LOG</h1>

      {project ? (
        <WebhookLogSection projectId={project.id} />
      ) : (
        <p className="text-text-muted text-sm">No project found.</p>
      )}
    </div>
  );
}
