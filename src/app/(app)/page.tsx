import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authInstance } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { getEnrichedSessions } from '@/queries/agent-sessions-query';
import { taskRepository } from '@/repositories/task-repository';
import { DashboardClient, type AgentSession, type BlockedTask } from './dashboard-client';

export default async function MissionControlPage() {
  const session = await authInstance.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect('/login');
  }

  const projects = await projectRepository.getByUserId(session.user.id);
  const cookieStore = await cookies();
  const activeProjectIdStr = cookieStore.get('active-project-id')?.value;

  let validatedProjectId: number | null = null;
  if (activeProjectIdStr) {
    const id = parseInt(activeProjectIdStr, 10);
    if (projects.some((p) => p.id === id)) {
      validatedProjectId = id;
    }
  }

  if (validatedProjectId === null && projects.length > 0) {
    validatedProjectId = projects[0].id;
  }

  let initialSessions: AgentSession[] = [];
  let initialTasks: BlockedTask[] = [];

  if (validatedProjectId) {
    const enrichedSessionsResult = await getEnrichedSessions(
      { projectId: validatedProjectId, limit: 4 },
      [validatedProjectId]
    );
    initialSessions = enrichedSessionsResult.data as unknown as AgentSession[];

    // The API route currently gets all blocked tasks and doesn't filter by projectId
    // but ideally we should only pass the blocked tasks relevant to the project or user.
    // For now, mirroring the API's current behavior of getting all blocked tasks.
    const blockedTasks = await taskRepository.getByStatus('blocked');

    // Attempt to filter in memory if possible, otherwise just use them all.
    // Actually, taskRepository doesn't eagerly load specs/projects in getByStatus.
    initialTasks = blockedTasks as unknown as BlockedTask[];
  }

  return (
    <div className="-mx-6 -mt-6 flex min-h-full flex-col">
      {/* Header */}
      <div className="border-border-default flex items-center justify-between border-b px-6 py-4">
        <div>
          <div className="text-text-secondary mb-1 font-mono text-xs tracking-[0.2em] uppercase">
            Mission Control
          </div>
          <h1 className="text-foreground text-xl font-semibold">Dashboard</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 px-6 py-6">
        <DashboardClient initialSessions={initialSessions} initialTasks={initialTasks} />
      </div>
    </div>
  );
}
