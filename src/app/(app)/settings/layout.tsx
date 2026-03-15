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
    <div className="flex gap-8">
      <SettingsNav userRole={userRole} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
