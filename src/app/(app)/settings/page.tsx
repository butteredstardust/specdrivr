import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { memberRepository } from '@/repositories/member-repository';
import { getProjectRole } from '@/lib/rbac';
import type { UserRole } from '@/db/schema';
import { ProfileForm } from '@/components/settings/profile-form';
import { ProjectSettingsForm } from '@/components/settings/project-settings-form';
import { MembersSection } from '@/components/settings/members-section';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const projects = await projectRepository.getByUserId(session.user.id);
  const project = projects[0] ?? null;

  // Derive role from the user's actual membership in the active project,
  // falling back to 'viewer' if there is no project yet.
  const userRole: UserRole = project
    ? ((await getProjectRole(session.user.id, project.id)) ?? 'viewer')
    : 'viewer';

  // Pre-fetch members server-side so MembersSection needs no useEffect fetch.
  const initialMembers = project ? await memberRepository.getByProjectId(project.id) : [];

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h1 className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">SETTINGS</h1>

      <ProfileForm
        user={{
          id: session.user.id,
          name: session.user.name ?? '',
          email: session.user.email ?? '',
        }}
      />

      {project && (
        <ProjectSettingsForm
          project={{
            id: project.id,
            name: project.name,
            description: project.description ?? null,
            repositoryUrl: project.repositoryUrl ?? null,
          }}
          userRole={userRole}
        />
      )}

      {project && (
        <MembersSection
          projectId={project.id}
          userRole={userRole}
          initialMembers={initialMembers}
        />
      )}
    </div>
  );
}
