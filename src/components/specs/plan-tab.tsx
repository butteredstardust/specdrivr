'use client';

import { useState } from 'react';
import { usePolling } from '@/hooks/use-polling';
import { StatusIcon } from '@/components/ui/status-icon';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { SpecStatus } from '@/components/specs/spec-editor';
import type { UserRole } from '@/db/schema';
import { ElapsedTimer, GatedButton, PlanDocument, hasRole, timeAgo } from './plan/shared';
import { usePlan } from './plan/use-plan';
import { PlanReview } from './plan/plan-review';

interface PlanTabProps {
  spec: { id: number; status: SpecStatus };
  userRole: UserRole;
}

/**
 * Routes between the plan's lifecycle states. Each state is read-only except
 * `pending_approval`, which lives in `plan/plan-review.tsx`; the document fetch
 * and every mutation live in `plan/use-plan.ts`.
 */
export function PlanTab({ spec, userRole }: PlanTabProps): React.ReactElement {
  const [startedAt] = useState(() => new Date());

  // Poll spec status while the plan is still being generated.
  const { data: polledSpec } = usePolling<{ id: number; status: SpecStatus }>({
    url: spec.status === 'pending_plan' ? `/api/v1/specs/${spec.id}` : null,
    interval: 3000,
    stopWhen: (s) => s?.status !== 'pending_plan',
  });

  const effectiveStatus = polledSpec?.status ?? spec.status;
  const isGenerating = effectiveStatus === 'pending_plan';

  const actions = usePlan({ specId: spec.id, enabled: !isGenerating });
  const { plan, isLoading, error, isActioning, regenerate } = actions;

  const canAdmin = hasRole(userRole, 'admin');
  const canMember = hasRole(userRole, 'member');

  const elapsedSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
  const isTimedOut = isGenerating && elapsedSeconds >= 120;
  const isSlowWarning = isGenerating && elapsedSeconds >= 30 && !isTimedOut;

  const regenerateButton = (
    <GatedButton
      allowed={canMember}
      requires="Member"
      variant="default"
      size="sm"
      onClick={() => regenerate()}
      disabled={isActioning}
    >
      Regenerate plan
    </GatedButton>
  );

  // --- Generating ---
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center gap-4 py-16" aria-live="polite">
        {isTimedOut ? (
          <>
            <StatusIcon size={24} status="error" />
            <p className="text-danger text-sm">Plan generation timed out. Please try again.</p>
          </>
        ) : (
          <>
            <StatusIcon size={24} status="working" />
            <p className="text-fg-secondary text-sm">Generating plan…</p>
            <ElapsedTimer startedAt={startedAt} />
            {isSlowWarning && (
              <p className="text-warning max-w-xs text-center text-xs">
                Taking longer than expected…
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-fg-muted py-8 text-center text-sm">Loading plan…</div>;
  }

  if (error) {
    return <p className="text-danger py-8 text-center text-sm">{error}</p>;
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <StatusIcon size={24} status="idle" />
        <p className="text-fg-secondary text-sm">No plan found.</p>
        <p className="text-fg-muted text-xs">
          Approve your specification to generate an implementation plan.
        </p>
      </div>
    );
  }

  // --- Approved / executing / completed ---
  if (plan.status === 'approved' || plan.status === 'executing' || plan.status === 'completed') {
    const isExecuting = plan.status === 'executing';
    const banner = isExecuting
      ? { frame: 'border-accent-border bg-accent-subtle', text: 'text-accent', label: 'Executing' }
      : {
          frame: 'border-success-border bg-success-bg',
          text: 'text-success',
          label: plan.status === 'approved' ? 'Approved' : 'Completed',
        };

    return (
      <div className="space-y-4">
        <div className={`flex items-center gap-2.5 rounded-md border px-3 py-2.5 ${banner.frame}`}>
          <StatusIcon size={16} status={isExecuting ? 'working' : 'idle'} />
          <span className={`text-xs font-semibold ${banner.text}`}>{banner.label}</span>
          <span className="text-fg-muted text-2xs">{timeAgo(plan.updatedAt)}</span>
        </div>
        <PlanDocument content={plan.markdownContent} />
      </div>
    );
  }

  // --- Rejected / abandoned ---
  if (plan.status === 'rejected' || plan.status === 'abandoned') {
    return (
      <TooltipProvider>
        <div className="flex flex-col items-center gap-4 py-12">
          <StatusIcon size={24} status="blocked" />
          <p className="text-fg-secondary text-sm">Plan {plan.status}. Regenerate to continue.</p>
          {regenerateButton}
        </div>
      </TooltipProvider>
    );
  }

  // --- Changes requested ---
  if (plan.status === 'changes_requested') {
    return (
      <TooltipProvider>
        <div className="space-y-4">
          {plan.reviewerFeedback && (
            <blockquote className="border-warning bg-warning-bg border-l-2 py-2 pl-4">
              <p className="text-warning text-xs font-medium">Reviewer feedback</p>
              <p className="text-fg-secondary mt-1 text-sm">{plan.reviewerFeedback}</p>
            </blockquote>
          )}
          <PlanDocument content={plan.markdownContent} />
          {regenerateButton}
        </div>
      </TooltipProvider>
    );
  }

  // --- Pending approval ---
  return (
    <TooltipProvider>
      <PlanReview plan={plan} canAdmin={canAdmin} canMember={canMember} actions={actions} />
    </TooltipProvider>
  );
}
