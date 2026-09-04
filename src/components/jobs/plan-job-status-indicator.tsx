'use client';

import { useActivePlanJobs } from '@/hooks/use-active-plan-jobs';
import { StatusIcon } from '@/components/ui/status-icon';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanJobStatusIndicatorProps {
  projectId: number;
  className?: string;
}

export function PlanJobStatusIndicator({ projectId, className }: PlanJobStatusIndicatorProps) {
  const { activeJobs } = useActivePlanJobs(projectId);

  if (activeJobs.length === 0) return null;

  const job = activeJobs[0]; // Show the most recent active job
  const isGeneratingTasks = job.type === 'generate_tasks';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={
        isGeneratingTasks ? 'AI agent architecting tasks' : 'AI agent generating execution plan'
      }
      className={cn(
        'bg-surface-overlay border-line animate-in fade-in slide-in-from-bottom-2 shadow-popover flex items-center gap-3 rounded-lg border px-4 py-2 backdrop-blur-sm',
        className
      )}
    >
      <div className="relative">
        <StatusIcon size={18} status="working" />
        <div className="absolute -top-1 -right-1">
          <Loader2 className="text-accent h-3 w-3 animate-spin" />
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-fg-muted text-2xs">AI AGENT WORKING</span>
        <span className="text-fg text-xs font-medium">
          {isGeneratingTasks ? 'Architecting tasks...' : 'Generating execution plan...'}
        </span>
      </div>
      <Badge variant="info" className="text-2xs ml-2 h-5 px-2">
        {job.status.toUpperCase()}
      </Badge>
    </div>
  );
}
