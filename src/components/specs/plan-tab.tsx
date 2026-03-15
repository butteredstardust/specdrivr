'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SpecStatus } from '@/components/specs/spec-editor';
import type { UserRole } from '@/db/schema';

interface PlanTabProps {
  spec: { id: number; status: SpecStatus };
  userRole: UserRole;
}

type PlanStatus =
  | 'pending_approval'
  | 'changes_requested'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'rejected'
  | 'abandoned';

interface Plan {
  id: number;
  content: string;
  status: PlanStatus;
  reviewerFeedback?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ROLE_RANK: Record<UserRole, number> = { viewer: 0, member: 1, admin: 2, owner: 3 };

function hasRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[required];
}

function ElapsedTimer({ startedAt }: { startedAt: Date }): React.ReactElement {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return (
    <span className="text-text-muted font-mono text-xs">
      {mins > 0 ? `${mins}m ` : ''}
      {secs}s
    </span>
  );
}

export function PlanTab({ spec, userRole }: PlanTabProps): React.ReactElement {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);
  const [startedAt] = useState(() => new Date());

  // Feedback panels
  const [changesOpen, setChangesOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [rejectText, setRejectText] = useState('');
  const [isActioning, setIsActioning] = useState(false);

  // Poll spec status when pending_plan
  const pollUrl = spec.status === 'pending_plan' ? `/api/v1/specs/${spec.id}` : null;
  const { data: polledSpec } = usePolling<{ id: number; status: SpecStatus }>({
    url: pollUrl,
    interval: 3000,
    stopWhen: (s) => s?.status !== 'pending_plan',
  });

  const effectiveStatus = polledSpec?.status ?? spec.status;
  const elapsedSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000);
  const isTimedOut = effectiveStatus === 'pending_plan' && elapsedSeconds >= 120;
  const isSlowWarning = effectiveStatus === 'pending_plan' && elapsedSeconds >= 30 && !isTimedOut;

  // Fetch plan when not pending_plan
  const fetchPlan = useCallback(async () => {
    if (effectiveStatus === 'pending_plan') return;
    setPlanLoading(true);
    setPlanError(null);
    try {
      const res = await fetch(`/api/v1/specs/${spec.id}/plan`, { credentials: 'include' });
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
      const msg = err instanceof Error ? err.message : 'Failed to load plan';
      setPlanError(msg);
      clientLogger.error('PlanTab: failed to fetch plan', err);
    } finally {
      setPlanLoading(false);
    }
  }, [spec.id, effectiveStatus]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Actions
  const handleApprove = async () => {
    if (!plan) return;
    setIsActioning(true);
    try {
      const res = await fetch(`/api/v1/plans/${plan.id}/approve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('Plan approved.');
      router.refresh();
    } catch (err) {
      clientLogger.error('PlanTab: approve failed', err);
      toast.error('Failed to approve plan.');
    } finally {
      setIsActioning(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!plan || !feedbackText.trim()) return;
    setIsActioning(true);
    try {
      const res = await fetch(`/api/v1/plans/${plan.id}/request-changes`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: feedbackText }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('Changes requested.');
      setChangesOpen(false);
      setFeedbackText('');
      router.refresh();
    } catch (err) {
      clientLogger.error('PlanTab: request-changes failed', err);
      toast.error('Failed to request changes.');
    } finally {
      setIsActioning(false);
    }
  };

  const handleReject = async () => {
    if (!plan || !rejectText.trim()) return;
    setIsActioning(true);
    try {
      const res = await fetch(`/api/v1/plans/${plan.id}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectText }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('Plan rejected.');
      setRejectOpen(false);
      setRejectText('');
      router.refresh();
    } catch (err) {
      clientLogger.error('PlanTab: reject failed', err);
      toast.error('Failed to reject plan.');
    } finally {
      setIsActioning(false);
    }
  };

  const handleRegenerate = async () => {
    setIsActioning(true);
    try {
      const res = await fetch(`/api/v1/specs/${spec.id}/regenerate-plan`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('Plan regeneration started.');
      router.refresh();
    } catch (err) {
      clientLogger.error('PlanTab: regenerate failed', err);
      toast.error('Failed to regenerate plan.');
    } finally {
      setIsActioning(false);
    }
  };

  const canAdmin = hasRole(userRole, 'admin');
  const canMember = hasRole(userRole, 'member');

  // --- State 1: pending_plan ---
  if (effectiveStatus === 'pending_plan') {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        {isTimedOut ? (
          <>
            <DaemonMascot size={48} expression="error" />
            <p className="text-status-red font-mono text-sm">
              Plan generation timed out. Please try again.
            </p>
          </>
        ) : (
          <>
            <DaemonMascot size={48} expression="working" />
            <p className="text-text-secondary font-mono text-sm tracking-widest uppercase">
              GENERATING PLAN…
            </p>
            <ElapsedTimer startedAt={startedAt} />
            {isSlowWarning && (
              <p className="text-phosphor-amber max-w-xs text-center font-mono text-xs">
                Taking longer than expected…
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  // Loading plan from API
  if (planLoading) {
    return <div className="text-text-muted py-8 text-center font-mono text-xs">Loading plan…</div>;
  }

  if (planError) {
    return <p className="text-status-red py-8 text-center font-mono text-xs">{planError}</p>;
  }

  if (!plan) {
    return <p className="text-text-muted py-8 text-center font-mono text-xs">No plan found.</p>;
  }

  // --- State 4: approved | executing | completed ---
  if (plan.status === 'approved' || plan.status === 'executing' || plan.status === 'completed') {
    const isExecuting = plan.status === 'executing';
    const bannerBorder = isExecuting
      ? 'border-accent-violet/30 bg-accent-violet/5'
      : 'border-status-emerald/30 bg-status-emerald/5';
    const bannerText = isExecuting ? 'text-accent-violet' : 'text-status-emerald';
    const bannerLabel = isExecuting
      ? 'EXECUTING'
      : plan.status === 'approved'
        ? 'APPROVED'
        : 'COMPLETED';

    return (
      <div className="space-y-4">
        <div className={`flex items-center gap-2.5 rounded border px-3 py-2.5 ${bannerBorder}`}>
          <DaemonMascot size={16} expression={isExecuting ? 'working' : 'idle'} />
          <span className={`font-mono text-xs font-semibold tracking-widest ${bannerText}`}>
            {bannerLabel}
          </span>
          <span className="text-muted-foreground font-mono text-xs">{timeAgo(plan.updatedAt)}</span>
        </div>
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{plan.content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  // --- State 5: rejected | abandoned ---
  if (plan.status === 'rejected' || plan.status === 'abandoned') {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <DaemonMascot size={48} expression="blocked" />
        <p className="text-text-muted font-mono text-sm">
          Plan {plan.status}. Re-generate to continue.
        </p>
        <TooltipProvider>
          {canMember ? (
            <Button size="sm" onClick={handleRegenerate} disabled={isActioning}>
              Re-generate Plan
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button size="sm" disabled aria-disabled>
                    Re-generate Plan
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Requires Member role or higher</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
    );
  }

  // --- State 3: changes_requested ---
  if (plan.status === 'changes_requested') {
    return (
      <div className="space-y-4">
        {plan.reviewerFeedback && (
          <blockquote className="border-phosphor-amber bg-phosphor-amber/5 border-l-2 py-2 pl-4">
            <p className="text-phosphor-amber font-mono text-xs">Reviewer feedback:</p>
            <p className="text-text-secondary mt-1 text-sm">{plan.reviewerFeedback}</p>
          </blockquote>
        )}
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{plan.content}</ReactMarkdown>
        </div>
        <TooltipProvider>
          {canMember ? (
            <Button size="sm" onClick={handleRegenerate} disabled={isActioning}>
              Re-generate Plan
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button size="sm" disabled aria-disabled>
                    Re-generate Plan
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Requires Member role or higher</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
    );
  }

  // --- State 2: pending_approval ---
  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{plan.content}</ReactMarkdown>
        </div>

        {/* Action buttons — always rendered */}
        <div className="flex flex-wrap gap-2">
          {/* Approve */}
          {canAdmin ? (
            <Button
              size="sm"
              className="bg-emerald-700 text-white hover:bg-emerald-600"
              onClick={handleApprove}
              disabled={isActioning}
            >
              Approve Plan
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button size="sm" className="bg-emerald-700 text-white" disabled aria-disabled>
                    Approve Plan
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Requires Admin role or higher</TooltipContent>
            </Tooltip>
          )}

          {/* Request Changes */}
          {canAdmin ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setChangesOpen((v) => !v);
                setRejectOpen(false);
              }}
              disabled={isActioning}
            >
              Request Changes
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button size="sm" variant="outline" disabled aria-disabled>
                    Request Changes
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Requires Admin role or higher</TooltipContent>
            </Tooltip>
          )}

          {/* Reject */}
          {canAdmin ? (
            <Button
              size="sm"
              variant="outline"
              className="text-status-red hover:text-status-red"
              onClick={() => {
                setRejectOpen((v) => !v);
                setChangesOpen(false);
              }}
              disabled={isActioning}
            >
              Reject Plan
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-status-red"
                    disabled
                    aria-disabled
                  >
                    Reject Plan
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Requires Admin role or higher</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Request Changes panel */}
        {changesOpen && (
          <div className="border-border-default bg-bg-elevated space-y-2 rounded-md border p-4">
            <p className="text-text-muted font-mono text-xs">Describe the required changes:</p>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="The plan needs to..."
              className="min-h-24"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleRequestChanges}
                disabled={isActioning || !feedbackText.trim()}
              >
                Submit Feedback
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setChangesOpen(false);
                  setFeedbackText('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Reject panel */}
        {rejectOpen && (
          <div className="border-border-default bg-bg-elevated space-y-2 rounded-md border p-4">
            <p className="text-text-muted font-mono text-xs">Reason for rejection:</p>
            <Textarea
              value={rejectText}
              onChange={(e) => setRejectText(e.target.value)}
              placeholder="Rejecting because..."
              className="min-h-24"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-status-red hover:bg-status-red/80 text-white"
                onClick={handleReject}
                disabled={isActioning || !rejectText.trim()}
              >
                Confirm Rejection
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setRejectOpen(false);
                  setRejectText('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
