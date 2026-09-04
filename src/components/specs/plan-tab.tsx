'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
import { StatusIcon } from '@/components/ui/status-icon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2 } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  markdownContent: string;
  status: PlanStatus;
  reviewerFeedback?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  taskCount?: number | null;
  executionTarget?: { repository: string; branch: string };
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
    <span className="text-fg-muted font-mono text-xs">
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

  // Feedbacks and Edits
  const [changesOpen, setChangesOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [rejectText, setRejectText] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isActioning, setIsActioning] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

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
        setEditContent(json.data?.markdownContent || '');
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
  const handleSaveEdit = async () => {
    if (!plan || !editContent.trim()) return;
    setIsActioning(true);
    try {
      const res = await fetch(`/api/v1/plans/${plan.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdownContent: editContent }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('Plan saved successfully.');
      setIsEditing(false);
      router.refresh();
      await fetchPlan(); // re-fetch to sync
    } catch (err) {
      clientLogger.error('PlanTab: save edit failed', err);
      toast.error('Failed to save plan edits.');
    } finally {
      setIsActioning(false);
    }
  };
  const handleApprove = async () => {
    if (!plan) return;
    setIsActioning(true);
    try {
      const res = await fetch(`/api/v1/plans/${plan.id}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: approvalNotes.trim() || null }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('Plan approved.');
      setApproveOpen(false);
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
      const res = await fetch(`/api/v1/specs/${spec.id}/plan/generate`, {
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
            <StatusIcon size={24} status="error" />
            <p className="text-danger font-mono text-sm">
              Plan generation timed out. Please try again.
            </p>
          </>
        ) : (
          <>
            <StatusIcon size={24} status="working" />
            <p className="text-fg-secondary font-mono text-sm tracking-widest uppercase">
              GENERATING PLAN…
            </p>
            <ElapsedTimer startedAt={startedAt} />
            {isSlowWarning && (
              <p className="text-warning max-w-xs text-center font-mono text-xs">
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
    return <div className="text-fg-muted py-8 text-center font-mono text-xs">Loading plan…</div>;
  }

  if (planError) {
    return <p className="text-danger py-8 text-center font-mono text-xs">{planError}</p>;
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <StatusIcon size={24} status="idle" />
        <p className="text-fg-secondary font-mono text-sm">No plan found.</p>
        <p className="text-fg-muted font-mono text-xs italic">
          &quot;Approve your specification to generate an implementation plan.&quot;
        </p>
      </div>
    );
  }

  // --- State 4: approved | executing | completed ---
  if (plan.status === 'approved' || plan.status === 'executing' || plan.status === 'completed') {
    const isExecuting = plan.status === 'executing';
    const bannerBorder = isExecuting
      ? 'border-accent/30 bg-surface-inset/5'
      : 'border-success/30 bg-success/5';
    const bannerText = isExecuting ? 'text-accent' : 'text-success';
    const bannerLabel = isExecuting
      ? 'EXECUTING'
      : plan.status === 'approved'
        ? 'APPROVED'
        : 'COMPLETED';

    return (
      <div className="space-y-4">
        <div className={`flex items-center gap-2.5 rounded border px-3 py-2.5 ${bannerBorder}`}>
          <StatusIcon size={16} status={isExecuting ? 'working' : 'idle'} />
          <span className={`font-mono text-xs font-semibold tracking-widest ${bannerText}`}>
            {bannerLabel}
          </span>
          <span className="text-fg-muted font-mono text-xs">{timeAgo(plan.updatedAt)}</span>
        </div>
        <div className="border-line bg-surface-inset border-line rounded-md border p-4">
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>{plan.markdownContent}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  // --- State 5: rejected | abandoned ---
  if (plan.status === 'rejected' || plan.status === 'abandoned') {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <StatusIcon size={24} status="blocked" />
        <p className="text-fg-muted font-mono text-sm">
          Plan {plan.status}. Re-generate to continue.
        </p>
        <TooltipProvider>
          {canMember ? (
            <Button variant="warning" size="sm" onClick={handleRegenerate} disabled={isActioning}>
              Re-generate Plan
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button variant="warning" size="sm" disabled aria-disabled>
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
          <blockquote className="border-warning bg-warning/5 border-l-2 py-2 pl-4">
            <p className="text-warning font-mono text-xs">Reviewer feedback:</p>
            <p className="text-fg-secondary mt-1 text-sm">{plan.reviewerFeedback}</p>
          </blockquote>
        )}
        <div className="border-line bg-surface-inset border-line rounded-md border p-4">
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>{plan.markdownContent}</ReactMarkdown>
          </div>
        </div>
        <TooltipProvider>
          {canMember ? (
            <Button variant="warning" size="sm" onClick={handleRegenerate} disabled={isActioning}>
              Re-generate Plan
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button variant="warning" size="sm" disabled aria-disabled>
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
      <div className="space-y-4">
        {/* Status banner ABOVE content */}
        <div className="border-warning/20 bg-warning/5 flex items-center gap-3 rounded-md border px-3 py-2.5">
          <StatusIcon size={16} status="working" />
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-warning font-mono text-xs font-semibold tracking-widest uppercase">
              Plan Ready for Review
            </span>
            <span className="text-fg-muted font-mono text-[10px]">
              {timeAgo(plan.createdAt)}
              {plan.taskCount != null ? ` · ${plan.taskCount} tasks` : ''}
            </span>
          </div>
          <div className="flex gap-2">
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
            {canAdmin ? (
              <Button
                size="sm"
                variant="outline"
                className="text-danger hover:text-danger"
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
                      className="text-danger"
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
            {canAdmin ? (
              <Button
                size="sm"
                variant="outline"
                className="border-success/50 text-success hover:bg-success/10 h-8 gap-1.5 font-mono text-[10px] tracking-widest uppercase"
                onClick={() => setApproveOpen(true)}
                disabled={isActioning}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve & Execute
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-success/50 text-success h-8 gap-1.5 font-mono text-[10px] tracking-widest uppercase opacity-50"
                      disabled
                      aria-disabled
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve & Execute
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Requires Admin role or higher</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Plan document (Editable when pending_approval) */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-fg-muted font-mono text-[10px] tracking-[0.2em] uppercase">
              Plan Document
            </p>
            {canMember && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px]"
                      onClick={() => {
                        setEditContent(plan.markdownContent);
                        setIsEditing(false);
                      }}
                      disabled={isActioning}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px]"
                      onClick={handleSaveEdit}
                      disabled={isActioning || editContent === plan.markdownContent}
                    >
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px]"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Plan
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="border-line bg-surface-inset border-line rounded-md border p-4">
            {isEditing ? (
              <CodeMirror
                value={editContent}
                onChange={(value) => setEditContent(value)}
                extensions={[
                  markdown({ base: markdownLanguage, codeLanguages: languages }),
                  EditorView.lineWrapping,
                ]}
                theme="dark"
                className="min-h-[300px] text-sm"
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: true,
                  foldGutter: true,
                }}
              />
            ) : (
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{plan.markdownContent}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* Request Changes panel */}
        {changesOpen && (
          <div className="border-line bg-surface-inset space-y-2 rounded-md border p-4">
            <p className="text-fg-muted font-mono text-xs">Describe the required changes:</p>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="The plan needs to..."
              className="min-h-24"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="warning"
                onClick={handleRequestChanges}
                disabled={isActioning || !feedbackText.trim()}
                className="h-8 font-mono text-[10px] tracking-widest uppercase"
              >
                Submit Feedback
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 font-mono text-[10px] tracking-widest uppercase"
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
          <div className="border-line bg-surface-inset space-y-2 rounded-md border p-4">
            <p className="text-fg-muted font-mono text-xs">Reason for rejection:</p>
            <Textarea
              value={rejectText}
              onChange={(e) => setRejectText(e.target.value)}
              placeholder="Rejecting because..."
              className="min-h-24"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-danger/10 border-danger/50 text-danger hover:bg-danger/20 h-8 font-mono text-[10px] tracking-widest uppercase"
                onClick={handleReject}
                disabled={isActioning || !rejectText.trim()}
              >
                Confirm Rejection
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 font-mono text-[10px] tracking-widest uppercase"
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
        <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve and start execution?</AlertDialogTitle>
              <AlertDialogDescription>
                Review the execution target before starting {plan.taskCount ?? 0} tasks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="border-line bg-surface-inset space-y-1 rounded border p-3 font-mono text-xs">
              <p>Repository: {plan.executionTarget?.repository ?? 'Not configured'}</p>
              <p>Branch: {plan.executionTarget?.branch ?? 'main'}</p>
              <p>Tasks: {plan.taskCount ?? 0}</p>
            </div>
            <Textarea
              value={approvalNotes}
              onChange={(event) => setApprovalNotes(event.target.value)}
              placeholder="Optional approval notes"
            />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isActioning}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleApprove} disabled={isActioning}>
                {isActioning ? 'Starting…' : 'Approve & Execute'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
