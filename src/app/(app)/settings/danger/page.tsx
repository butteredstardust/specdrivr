import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { getProjectRole } from '@/lib/rbac';
import { DangerZoneSection } from '@/components/settings/danger-zone-section';

export default async function DangerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const projects = await projectRepository.getByUserId(session.user.id);
  const project = projects[0] ?? null;

  if (!project) {
    return (
      <div className="flex max-w-2xl flex-col gap-8">
        <h1 className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">
          DANGER ZONE
        </h1>
        <p className="font-mono text-xs text-[--text-muted]">No project found.</p>
      </div>
    );
  }

  const userRole = (await getProjectRole(session.user.id, project.id)) ?? 'viewer';

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h1 className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">
        DANGER ZONE
      </h1>
      <DangerZoneSection project={{ id: project.id, name: project.name }} userRole={userRole} />
    </div>
  );
}
