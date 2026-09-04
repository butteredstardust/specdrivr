'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { StatusIcon } from '@/components/ui/status-icon';
import { Badge } from '@/components/ui/badge';
import { SESSION_STATUS } from '@/lib/ui-status';
import { Button } from '@/components/ui/button';
import { ASCIIProgress } from '@/components/ui/progress';

interface RecentSession {
  id: number;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  tasksExecuted: number;
  tasksSucceeded?: number;
  tasksFailed?: number;
  totalTasks?: number | null;
  specTitle?: string | null;
  specName?: string | null;
  backend?: string;
}

interface RecentSessionsProps {
  sessions: RecentSession[];
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <StatusIcon size={28} status="idle" />
        <div>
          <h3 className="text-fg mb-1 text-lg font-medium">No recent activity</h3>
          <p className="text-fg-muted max-w-sm text-sm">
            When you approve and execute a plan, it will appear here. Start by creating a
            specification.
          </p>
        </div>
        <Button asChild variant="warning">
          <Link href="/specs/new">Create Specification</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-fg-muted font-mono text-[10px] tracking-[0.15em] uppercase opacity-70">
        Recent Activity
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sessions.map((session) => {
          return (
            <Link
              key={session.id}
              href={`/sessions/${session.id}`}
              className="group border-line bg-surface-raised hover:border-line-strong flex flex-col gap-4 rounded-lg border p-5 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={SESSION_STATUS[session.status].variant}
                    dot={session.status === 'running'}
                  >
                    {SESSION_STATUS[session.status].label}
                  </Badge>
                </div>
                <span className="text-fg-muted font-mono text-[9px] tracking-wider uppercase opacity-60">
                  {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-fg group-hover:text-accent truncate font-mono font-medium transition-colors">
                  {session.specTitle || session.specName || `Session #${session.id}`}
                </p>
                <div className="text-fg-muted flex flex-col gap-2 font-mono text-[10px] tracking-wider uppercase opacity-70">
                  <div className="flex items-center justify-between">
                    <span>{session.tasksExecuted ?? 0} tasks executed</span>
                    {session.totalTasks && session.totalTasks > 0 && (
                      <span className="text-success">
                        {Math.round(((session.tasksSucceeded ?? 0) / session.totalTasks) * 100)}%
                      </span>
                    )}
                  </div>
                  {session.totalTasks && session.totalTasks > 0 && (
                    <ASCIIProgress
                      value={session.tasksSucceeded ?? 0}
                      max={session.totalTasks}
                      length={24}
                      className="text-success origin-left scale-x-105"
                    />
                  )}
                  {session.backend && (
                    <div className="mt-1">
                      <span className="bg-surface-inset border-line-subtle group-hover:bg-surface-inset/80 rounded border px-2 py-0.5 text-[9px] tracking-widest transition-colors">
                        {session.backend === 'claude' ? '🤖 CLAUDE' : '✨ GEMINI'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
