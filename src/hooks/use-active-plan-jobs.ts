'use client';

import { usePolling } from './use-polling';
import type { PlanJobSelect as PlanJob } from '@/db/schema';

export function useActivePlanJobs(projectId: number | undefined) {
  const { data, isLoading, error } = usePolling<PlanJob[]>({
    url: projectId ? `/api/v1/projects/${projectId}/plan-jobs/active` : null,
    interval: 3000,
    stopWhen: (jobs) => jobs.length === 0,
  });

  return {
    activeJobs: data ?? [],
    isLoading,
    error,
  };
}
