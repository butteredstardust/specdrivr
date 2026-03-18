'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { PixelBadge } from '@/components/ui/pixel-badge';
import { Button } from '@/components/ui/button';

interface RecentSession {
  id: number;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  tasksExecuted: number;
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
        <DaemonMascot size={64} expression="idle" />
        <div>
          <h3 className="text-foreground mb-1 text-lg font-medium">No recent activity</h3>
          <p className="text-text-muted max-w-sm text-sm">
            When you approve and execute a plan, it will appear here. Start by creating a
            specification.
          </p>
        </div>
        <Button asChild variant="phosphor">
          <Link href="/specs/new">Create Specification</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-text-muted font-mono text-xs tracking-widest uppercase">
        Recent Activity
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sessions.map((session) => {
          let variant: 'violet' | 'emerald' | 'red' | 'muted' | 'amber' = 'violet';
          let label: string = session.status;

          switch (session.status) {
            case 'completed':
              variant = 'emerald';
              label = 'Done';
              break;
            case 'failed':
              variant = 'red';
              break;
            case 'cancelled':
              variant = 'muted';
              break;
            case 'paused':
              variant = 'amber';
              break;
            case 'running':
              variant = 'violet';
              break;
          }

          return (
            <Link
              key={session.id}
              href={`/sessions/${session.id}`}
              className="border-border-default bg-bg-surface hover:border-border-hover flex flex-col gap-3 rounded-lg border p-4 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <PixelBadge variant={variant} dot={session.status === 'running'}>
                    {label}
                  </PixelBadge>
                </div>
                <span className="text-text-muted font-mono text-[10px]">
                  {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                </span>
              </div>

              <div>
                <p className="text-text-primary truncate font-mono text-sm">
                  {session.specTitle || session.specName || `Session #${session.id}`}
                </p>
                <div className="text-text-muted mt-2 flex items-center gap-3 font-mono text-xs">
                  <span>{session.tasksExecuted ?? 0} tasks</span>
                  {session.backend && (
                    <span className="bg-bg-elevated rounded px-1.5 py-0.5 text-[9px]">
                      {session.backend === 'claude' ? '🤖 Claude' : '✨ Gemini'}
                    </span>
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
