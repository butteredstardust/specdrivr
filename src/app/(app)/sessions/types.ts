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
  /** `specName` is what /api/v1/sessions returns; the table used to read a
   *  `specTitle` that no endpoint has ever sent, so every row fell back to
   *  the "Spec #3" placeholder. */
  specName?: string | null;
}
