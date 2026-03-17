import type { SessionStatus } from '@/db/schema';

export interface Session {
  id: number;
  specId: number;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string | null;
  tasksExecuted: number;
  tasksSucceeded: number;
  tasksFailed: number;
  totalTasks?: number | null;
  specTitle?: string;
}
