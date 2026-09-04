import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { getProjectRole } from '@/lib/rbac';
import type { UserRole } from '@/db/schema';
import { IntegrationsSection } from '@/components/settings/integrations-section';

export default async function IntegrationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const projects = await projectRepository.getByUserId(session.user.id);
  const project = projects[0] ?? null;

  const userRole: UserRole = project
    ? ((await getProjectRole(session.user.id, project.id)) ?? 'viewer')
    : 'viewer';

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <h2 className="text-fg-muted text-2xs">Integrations</h2>
      {project ? (
        <IntegrationsSection projectId={project.id} userRole={userRole} />
      ) : (
        <p className="text-fg-muted text-sm">No project found.</p>
      )}
    </div>
  );
}
