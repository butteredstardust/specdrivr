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
    <div className="-mx-6 -mt-6 flex min-h-full flex-col">
      {/* Header */}
      <div className="border-border border-b px-6 py-4">
        <div className="text-muted-foreground mb-1 font-mono text-[10px] tracking-[0.2em] uppercase">
          Settings
        </div>
        <h1 className="text-foreground text-xl font-semibold">Configuration</h1>
      </div>

      {/* Two-column body */}
      <div className="flex flex-1">
        <div className="border-border w-52 shrink-0 border-r px-4 py-6">
          <SettingsNav userRole={userRole} />
        </div>
        <div className="min-w-0 flex-1 px-8 py-6">{children}</div>
      </div>
    </div>
  );
}
