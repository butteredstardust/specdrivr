import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { getProjectRole } from '@/lib/rbac';
import type { UserRole } from '@/db/schema';
import { SettingsNav } from '@/components/settings/settings-nav';
import { PageHeader } from '@/components/ui/page-header';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const projects = await projectRepository.getByUserId(session.user.id);
  const project = projects[0] ?? null;

  const userRole: UserRole = project
    ? (((await getProjectRole(session.user.id, project.id)) ?? 'viewer') as UserRole)
    : 'viewer';

  return (
    <div className="animate-fade-in-up full-bleed fill-shell flex flex-col">
      <PageHeader category="Workspace" title="Configuration" />

      {/* Two-column body */}
      <div className="flex flex-1 flex-col md:flex-row">
        <div className="border-line w-full shrink-0 border-b px-4 py-4 md:w-50 md:border-r md:border-b-0 md:py-6">
          <SettingsNav userRole={userRole} />
        </div>
        <div className="min-w-0 flex-1 px-6 py-6 md:px-8">{children}</div>
      </div>
    </div>
  );
}
