import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { getProjectRole } from '@/lib/rbac';
import type { UserRole } from '@/db/schema';
import { ProjectSettingsForm } from '@/components/settings/project-settings-form';
import { OnboardingRestartSection } from '@/components/settings/onboarding-restart-section';

export default async function GeneralPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const projects = await projectRepository.getByUserId(session.user.id);
  const project = projects[0] ?? null;

  const userRole: UserRole = project
    ? ((await getProjectRole(session.user.id, project.id)) ?? 'viewer')
    : 'viewer';

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h2 className="text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase">General</h2>

      {project ? (
        <>
          <ProjectSettingsForm
            project={{
              id: project.id,
              name: project.name,
              description: project.description ?? null,
              repositoryUrl: project.repositoryUrl ?? null,
              repositoryBranch: project.repositoryBranch ?? null,
            }}
            userRole={userRole}
          />
          <OnboardingRestartSection />
        </>
      ) : (
        <p className="text-muted-foreground text-sm">No project found.</p>
      )}
    </div>
  );
}
