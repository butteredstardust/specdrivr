'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import type { Plan } from './shared';

interface UsePlanArgs {
  specId: number;
  /** The plan endpoint is only meaningful once generation has finished. */
  enabled: boolean;
}

/**
 * Owns the plan document and every mutation the review UI can perform.
 *
 * All five actions shared one shape — POST, toast, refresh, clear the busy flag
 * — so they run through a single `act` helper. `isActioning` is shared
 * deliberately: two concurrent plan mutations would race on the same row.
 */
export function usePlan({ specId, enabled }: UsePlanArgs) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  const fetchPlan = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/specs/${specId}/plan`, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 404) {
          setPlan(null);
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } else {
        const json = await res.json();
        setPlan(json.data ?? json);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plan');
      clientLogger.error('PlanTab: failed to fetch plan', err);
    } finally {
      setIsLoading(false);
    }
  }, [specId, enabled]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const act = useCallback(
    async (
      path: string,
      init: RequestInit,
      { success, failure, refetch = false }: { success: string; failure: string; refetch?: boolean }
    ): Promise<boolean> => {
      setIsActioning(true);
      try {
        const res = await fetch(path, { credentials: 'include', ...init });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        toast.success(success);
        router.refresh();
        if (refetch) await fetchPlan();
        return true;
      } catch (err) {
        clientLogger.error(`PlanTab: ${failure}`, err);
        toast.error(failure);
        return false;
      } finally {
        setIsActioning(false);
      }
    },
    [router, fetchPlan]
  );

  const json = (body: unknown): RequestInit => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return {
    plan,
    isLoading,
    error,
    isActioning,
    saveEdit: (content: string) =>
      plan
        ? act(
            `/api/v1/plans/${plan.id}`,
            { ...json({ markdownContent: content }), method: 'PATCH' },
            {
              success: 'Plan saved successfully.',
              failure: 'Failed to save plan edits.',
              refetch: true,
            }
          )
        : Promise.resolve(false),
    approve: (notes: string) =>
      plan
        ? act(`/api/v1/plans/${plan.id}/approve`, json({ notes: notes.trim() || null }), {
            success: 'Plan approved.',
            failure: 'Failed to approve plan.',
          })
        : Promise.resolve(false),
    requestChanges: (feedback: string) =>
      plan
        ? act(`/api/v1/plans/${plan.id}/request-changes`, json({ feedback }), {
            success: 'Changes requested.',
            failure: 'Failed to request changes.',
          })
        : Promise.resolve(false),
    reject: (reason: string) =>
      plan
        ? act(`/api/v1/plans/${plan.id}/reject`, json({ reason }), {
            success: 'Plan rejected.',
            failure: 'Failed to reject plan.',
          })
        : Promise.resolve(false),
    regenerate: () =>
      act(
        `/api/v1/specs/${specId}/plan/generate`,
        { method: 'POST' },
        { success: 'Plan regeneration started.', failure: 'Failed to regenerate plan.' }
      ),
  };
}
