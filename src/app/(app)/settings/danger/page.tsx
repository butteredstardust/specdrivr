import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { getProjectRole } from '@/lib/rbac';
import type { UserRole } from '@/db/schema';
import { DangerZoneSection } from '@/components/settings/danger-zone-section';

export default async function DangerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const projects = await projectRepository.getByUserId(session.user.id);
  const project = projects[0] ?? null;

  if (!project) {
    return (
      <div className="flex max-w-2xl flex-col gap-8">
        <h1 className="text-foreground text-lg font-semibold">DANGER ZONE</h1>
        <p className="text-text-muted font-mono text-xs">No project found.</p>
      </div>
    );
  }

  const userRole: UserRole = ((await getProjectRole(session.user.id, project.id)) ??
    'viewer') as UserRole;

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h1 className="text-foreground text-lg font-semibold">DANGER ZONE</h1>
      <DangerZoneSection project={{ id: project.id, name: project.name }} userRole={userRole} />
    </div>
  );
}
