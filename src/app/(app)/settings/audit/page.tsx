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
    <div className="flex max-w-4xl flex-col gap-8">
      <h1 className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">AUDIT LOG</h1>

      {canAudit ? (
        <AuditLogSection projectId={project!.id} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <Lock className="h-8 w-8 text-[--text-muted]" />
          <p className="text-sm text-[--text-muted]">Audit log requires Admin or Owner role.</p>
        </div>
      )}
    </div>
  );
}
