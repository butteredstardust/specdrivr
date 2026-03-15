import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { getProjectRole } from '@/lib/rbac';
import type { UserRole } from '@/db/schema';
import { AgentConfigForm } from '@/components/settings/agent-config-form';

export default async function AgentPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const projects = await projectRepository.getByUserId(session.user.id);
  const project = projects[0] ?? null;

  const userRole: UserRole = project
    ? ((await getProjectRole(session.user.id, project.id)) ?? 'viewer')
    : 'viewer';

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h1 className="text-foreground text-lg font-semibold">AGENT</h1>

      {project ? (
        <AgentConfigForm projectId={project.id} userRole={userRole} />
      ) : (
        <p className="text-text-muted text-sm">No project found.</p>
      )}
    </div>
  );
}
