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
        <h2 className="text-text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
          Activity Feed
        </h2>
        <p className="text-text-muted text-xs italic">Waiting for activity...</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <h2 className="text-text-muted font-mono text-[11px] tracking-[0.08em] uppercase">
        Activity Feed
      </h2>
      <div className="flex flex-col gap-3">
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
    <div className="group animate-in fade-in slide-in-from-left-1 flex items-start gap-3">
      <div
        className={cn(
          'bg-bg-elevated border-border-muted mt-0.5 shrink-0 rounded-md border p-1.5',
          colorClass
        )}
      >
        <Icon className="h-3 w-3" />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-text-primary text-xs leading-relaxed break-words">{item.message}</p>
        <div className="text-text-muted flex items-center gap-2 font-mono text-[10px] tracking-tighter uppercase">
          <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
          {item.sessionId && <span>· SES-{item.sessionId}</span>}
          {item.specId && <span>· SPEC-{item.specId}</span>}
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
  if (type.includes('START') || type.includes('APPROVED')) return 'text-accent-violet';
  return 'text-text-secondary';
}
