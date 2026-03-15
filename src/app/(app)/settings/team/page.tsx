import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { memberRepository } from '@/repositories/member-repository';
import { getProjectRole } from '@/lib/rbac';
import type { UserRole } from '@/db/schema';
import { MembersSection } from '@/components/settings/members-section';

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const projects = await projectRepository.getByUserId(session.user.id);
  const project = projects[0] ?? null;

  if (!project) {
    return (
      <div className="flex max-w-2xl flex-col gap-8">
        <h1 className="text-text-muted font-mono text-xs tracking-widest uppercase">TEAM</h1>
        <p className="text-text-muted font-mono text-xs">No project found.</p>
      </div>
    );
  }

  const userRole: UserRole = ((await getProjectRole(session.user.id, project.id)) ??
    'viewer') as UserRole;
  const initialMembers = await memberRepository.getByProjectId(project.id);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h1 className="text-text-muted font-mono text-xs tracking-widest uppercase">TEAM</h1>
      <MembersSection projectId={project.id} userRole={userRole} initialMembers={initialMembers} />
    </div>
  );
}
