'use client';

import { useActivePlanJobs } from '@/hooks/use-active-plan-jobs';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { PixelBadge } from '@/components/ui/pixel-badge';
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
      className={cn(
        'bg-bg-elevated/80 border-border-muted animate-in fade-in slide-in-from-bottom-2 flex items-center gap-3 rounded-full border px-4 py-2 shadow-lg backdrop-blur-sm',
        className
      )}
    >
      <div className="relative">
        <DaemonMascot size={24} expression="working" />
        <div className="absolute -top-1 -right-1">
          <Loader2 className="text-accent-violet h-3 w-3 animate-spin" />
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-[10px] tracking-widest uppercase opacity-50">
          AI AGENT WORKING
        </span>
        <span className="text-text-primary text-xs font-medium">
          {isGeneratingTasks ? 'Architecting tasks...' : 'Generating execution plan...'}
        </span>
      </div>
      <PixelBadge variant="violet" className="ml-2 h-5 px-2 text-[9px]">
        {job.status.toUpperCase()}
      </PixelBadge>
    </div>
  );
}
