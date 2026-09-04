import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { getProjectRole } from '@/lib/rbac';
import type { UserRole } from '@/db/schema';
import { AuditLogSection } from '@/components/settings/audit-log-section';
import { Lock } from 'lucide-react';

export default async function AuditPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const projects = await projectRepository.getByUserId(session.user.id);
  const project = projects[0] ?? null;

  const userRole: UserRole = project
    ? ((await getProjectRole(session.user.id, project.id)) ?? 'viewer')
    : 'viewer';

  const canAudit = userRole === 'admin' || userRole === 'owner';

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <h2 className="text-fg text-lg font-semibold">Audit log</h2>

      {canAudit ? (
        <AuditLogSection projectId={project!.id} />
      ) : (
        <div className="border-line bg-surface-raised flex flex-col items-center justify-center gap-3 rounded-lg border py-12">
          <Lock className="text-fg-muted size-6" />
          <p className="text-fg text-lg font-semibold">Audit log unavailable</p>
          <p className="text-fg-muted text-sm">Requires Admin or Owner role.</p>
        </div>
      )}
    </div>
  );
}
