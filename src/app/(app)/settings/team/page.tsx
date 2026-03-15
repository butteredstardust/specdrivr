import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { memberRepository } from '@/repositories/member-repository';
import { getProjectRole } from '@/lib/rbac';
import { MembersSection } from '@/components/settings/members-section';

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const projects = await projectRepository.getByUserId(session.user.id);
  const project = projects[0] ?? null;

  if (!project) {
    return (
      <div className="flex max-w-2xl flex-col gap-8">
        <h1 className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">TEAM</h1>
        <p className="font-mono text-xs text-[--text-muted]">No project found.</p>
      </div>
    );
  }

  const userRole = (await getProjectRole(session.user.id, project.id)) ?? 'viewer';
  const initialMembers = await memberRepository.getByProjectId(project.id);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h1 className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">TEAM</h1>
      <MembersSection projectId={project.id} userRole={userRole} initialMembers={initialMembers} />
    </div>
  );
}
