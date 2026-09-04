import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { UsageSection } from '@/components/settings/usage-section';

export default async function UsagePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const projects = await projectRepository.getByUserId(session.user.id);
  const project = projects[0] ?? null;

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <h2 className="text-fg-muted text-2xs">Usage — Last 30 Days</h2>

      {project ? (
        <UsageSection projectId={project.id} />
      ) : (
        <p className="text-fg-muted text-sm">No project found.</p>
      )}
    </div>
  );
}
