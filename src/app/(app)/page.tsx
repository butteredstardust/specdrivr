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

    const blockedTasks = await taskRepository.getBlockedByProjectId(validatedProjectId);
    initialTasks = blockedTasks as unknown as BlockedTask[];
  }

  return (
    <div className="flex min-h-full flex-col gap-6">
      <DashboardClient initialSessions={initialSessions} initialTasks={initialTasks} />
    </div>
  );
}
