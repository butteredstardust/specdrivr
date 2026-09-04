import type { PlanStatus, SessionStatus, SpecStatus, TaskStatus } from '@/db/schema';
import type { Status } from '@/components/ui/status-icon';
import type { BadgeProps } from '@/components/ui/badge';

/**
 * Single source of truth for how a domain status is presented.
 *
 * Before the overhaul this mapping was re-declared in task-drawer, task-row,
 * specs-client, sessions-table, session-panel and recent-sessions — six copies
 * that had already drifted apart on both labels and colours. Add a new status
 * here and every surface picks it up.
 *
 * The `status` field feeds StatusIcon (the glyph) and `variant` feeds Badge
 * (the colour). Both are always set, because DESIGN_SYSTEM.md §8.4 forbids
 * communicating status by colour alone.
 */
export interface StatusPresentation {
  label: string;
  variant: NonNullable<BadgeProps['variant']>;
  status: Status;
}

export const TASK_STATUS: Record<TaskStatus, StatusPresentation> = {
  todo: { label: 'Todo', variant: 'muted', status: 'idle' },
  in_progress: { label: 'Running', variant: 'info', status: 'working' },
  blocked: { label: 'Blocked', variant: 'warning', status: 'blocked' },
  done: { label: 'Done', variant: 'success', status: 'success' },
  failed: { label: 'Failed', variant: 'danger', status: 'error' },
  skipped: { label: 'Skipped', variant: 'muted', status: 'idle' },
};

export const SPEC_STATUS: Record<SpecStatus, StatusPresentation> = {
  drafting: { label: 'Draft', variant: 'muted', status: 'idle' },
  pending_plan: { label: 'Generating', variant: 'info', status: 'working' },
  pending_approval: { label: 'Review', variant: 'warning', status: 'blocked' },
  executing: { label: 'Running', variant: 'info', status: 'working' },
  completed: { label: 'Done', variant: 'success', status: 'success' },
  stalled: { label: 'Stalled', variant: 'danger', status: 'error' },
  archived: { label: 'Archived', variant: 'muted', status: 'idle' },
};

export const PLAN_STATUS: Record<PlanStatus, StatusPresentation> = {
  pending_approval: { label: 'Awaiting review', variant: 'warning', status: 'blocked' },
  executing: { label: 'Executing', variant: 'info', status: 'working' },
  rejected: { label: 'Rejected', variant: 'danger', status: 'error' },
  abandoned: { label: 'Abandoned', variant: 'muted', status: 'idle' },
  changes_requested: { label: 'Changes requested', variant: 'warning', status: 'blocked' },
  completed: { label: 'Completed', variant: 'success', status: 'success' },
};

export const SESSION_STATUS: Record<SessionStatus, StatusPresentation> = {
  running: { label: 'Running', variant: 'info', status: 'working' },
  paused: { label: 'Paused', variant: 'warning', status: 'blocked' },
  completed: { label: 'Completed', variant: 'success', status: 'success' },
  failed: { label: 'Failed', variant: 'danger', status: 'error' },
  cancelled: { label: 'Cancelled', variant: 'muted', status: 'idle' },
};

const FALLBACK: StatusPresentation = { label: 'Unknown', variant: 'muted', status: 'idle' };

/** Safe lookup for values arriving from the API that may not match the enum. */
export function presentStatus(
  map: Record<string, StatusPresentation>,
  key: string | null | undefined
): StatusPresentation {
  return (key && map[key]) || FALLBACK;
}
