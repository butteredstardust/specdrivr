import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { getProjectRole } from '@/lib/rbac';
import type { UserRole } from '@/db/schema';
import { SettingsNav } from '@/components/settings/settings-nav';

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
      {/* Header */}
      <div className="border-line border-b px-6 py-4">
        <div className="text-fg-secondary text-2xs mb-1 font-medium">Workspace</div>
        <h1 className="text-fg text-2xl leading-tight font-semibold tracking-[-0.015em]">
          Configuration
        </h1>
      </div>

      {/* Two-column body */}
      <div className="flex flex-1">
        <div className="border-line w-52 shrink-0 border-r px-4 py-6">
          <SettingsNav userRole={userRole} />
        </div>
        <div className="min-w-0 flex-1 px-8 py-6">{children}</div>
      </div>
    </div>
  );
}
