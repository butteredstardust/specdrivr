'use client';

import { useShell } from '@/components/shell/shell-context';
import { PlanJobStatusIndicator } from '@/components/jobs/plan-job-status-indicator';

export function ActiveJobsOverlay() {
  const { activeProjectId } = useShell();
  if (!activeProjectId) return null;

  return (
    <div className="pointer-events-none fixed right-8 bottom-8 z-30">
      <div className="pointer-events-auto">
        <PlanJobStatusIndicator projectId={activeProjectId} />
      </div>
    </div>
  );
}
