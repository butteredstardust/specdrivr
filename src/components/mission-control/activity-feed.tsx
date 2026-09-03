'use client';

import { usePolling } from '@/hooks/use-polling';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, XCircle, Play, AlertCircle, Brain, Wand2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: number;
  type: 'event' | 'job';
  eventType: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  sessionId: number | null;
  specId: number | null;
}

interface ProjectActivityFeedProps {
  projectId: number;
  className?: string;
}

export function ProjectActivityFeed({ projectId, className }: ProjectActivityFeedProps) {
  const { data: activity } = usePolling<ActivityItem[]>({
    url: `/api/v1/projects/${projectId}/activity`,
    interval: 5000,
  });

  if (!activity || activity.length === 0) {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        <h2 className="text-text-muted font-mono text-[10px] tracking-[0.15em] uppercase opacity-70">
          Activity Feed
        </h2>
        <div className="bg-bg-elevated/30 border-border-muted flex h-24 items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center">
          <p className="text-text-muted font-mono text-[10px] tracking-wider uppercase opacity-50">
            Waiting for activity...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <h2 className="text-text-muted font-mono text-[10px] tracking-[0.15em] uppercase opacity-70">
        Activity Feed
      </h2>
      <div className="flex flex-col gap-1.5">
        {activity.map((item) => (
          <ActivityRow key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = getIcon(item.eventType);
  const colorClass = getIconColor(item.eventType);

  return (
    <div className="hover:bg-bg-elevated/40 group animate-in fade-in slide-in-from-left-1 flex items-start gap-4 rounded-lg p-2 transition-all duration-200">
      <div
        className={cn(
          'bg-bg-elevated border-border-muted mt-0.5 shrink-0 rounded border p-2 shadow-sm transition-transform group-hover:scale-105',
          colorClass
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-text-secondary group-hover:text-text-primary text-xs leading-relaxed break-words transition-colors">
          {item.message}
        </p>
        <div className="text-text-muted flex items-center gap-2 font-mono text-[9px] tracking-wider uppercase opacity-70">
          <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
          {item.sessionId && (
            <span className="text-text-muted/40 font-mono tracking-normal">
              · <span className="text-accent-blue/60">SES-{item.sessionId}</span>
            </span>
          )}
          {item.specId && (
            <span className="text-text-muted/40 font-mono tracking-normal">
              · <span className="text-phosphor-amber/60">SPEC-{item.specId}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function getIcon(type: string) {
  switch (type) {
    case 'TASK_START':
      return Play;
    case 'TASK_DONE':
      return CheckCircle2;
    case 'TASK_FAILED':
      return XCircle;
    case 'TASK_BLOCKED':
      return AlertCircle;
    case 'JOB_STARTED':
      return Brain;
    case 'JOB_COMPLETED':
      return CheckCircle2;
    case 'JOB_FAILED':
      return XCircle;
    case 'PLAN_APPROVED':
      return Wand2;
    case 'SESSION_COMPLETED':
      return CheckCircle2;
    case 'SESSION_FAILED':
      return XCircle;
    default:
      return FileText;
  }
}

function getIconColor(type: string) {
  if (type.includes('FAILED') || type.includes('ERROR')) return 'text-status-red';
  if (type.includes('DONE') || type.includes('COMPLETED')) return 'text-status-emerald';
  if (type.includes('BLOCKED')) return 'text-phosphor-amber';
  if (type.includes('START') || type.includes('APPROVED')) return 'text-accent-blue';
  return 'text-text-secondary';
}
