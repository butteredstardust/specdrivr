'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusIcon } from '@/components/ui/status-icon';
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
import { GatedButton, timeAgo, type Plan } from './shared';
import type { usePlan } from './use-plan';

interface PlanReviewProps {
  plan: Plan;
  canAdmin: boolean;
  canMember: boolean;
  actions: ReturnType<typeof usePlan>;
}

/**
 * The `pending_approval` state: the only one where the plan is both editable
 * and actionable. Every other status renders read-only, so they stay in
 * `plan-tab.tsx`.
 */
export function PlanReview({ plan, canAdmin, canMember, actions }: PlanReviewProps) {
  const { isActioning, saveEdit, approve, requestChanges, reject } = actions;

  const [editContent, setEditContent] = useState(plan.markdownContent);
  const [isEditing, setIsEditing] = useState(false);
  // The two feedback panels are mutually exclusive — opening one closes the
  // other — so they share a single slot rather than a boolean each.
  const [panel, setPanel] = useState<'changes' | 'reject' | null>(null);
  const [panelText, setPanelText] = useState('');
  const [approveOpen, setApproveOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  const togglePanel = (next: 'changes' | 'reject') => {
    setPanel((current) => (current === next ? null : next));
    setPanelText('');
  };

  const closePanel = () => {
    setPanel(null);
    setPanelText('');
  };

  const submitPanel = async () => {
    const submit = panel === 'changes' ? requestChanges : reject;
    if (await submit(panelText)) closePanel();
  };

  const submitApproval = async () => {
    if (await approve(approvalNotes)) setApproveOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="border-warning-border bg-warning-bg flex flex-wrap items-center gap-3 rounded-md border px-3 py-2.5">
        <StatusIcon size={16} status="working" />
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-warning text-xs font-semibold">Plan ready for review</span>
          <span className="text-fg-muted text-2xs">
            {timeAgo(plan.createdAt)}
            {plan.taskCount != null ? ` · ${plan.taskCount} tasks` : ''}
          </span>
        </div>
        <div className="flex gap-2">
          <GatedButton
            allowed={canAdmin}
            requires="Admin"
            size="sm"
            variant="outline"
            onClick={() => togglePanel('changes')}
            disabled={isActioning}
          >
            Request changes
          </GatedButton>
          <GatedButton
            allowed={canAdmin}
            requires="Admin"
            size="sm"
            variant="outline"
            className="text-danger hover:text-danger"
            onClick={() => togglePanel('reject')}
            disabled={isActioning}
          >
            Reject plan
          </GatedButton>
          <GatedButton
            allowed={canAdmin}
            requires="Admin"
            size="sm"
            variant="outline"
            className="border-success-border text-success hover:bg-success-bg gap-1.5"
            onClick={() => setApproveOpen(true)}
            disabled={isActioning}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve &amp; execute
          </GatedButton>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-fg-muted text-2xs">Plan document</p>
          {canMember && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
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
                    onClick={async () => {
                      if (await saveEdit(editContent)) setIsEditing(false);
                    }}
                    disabled={isActioning || editContent === plan.markdownContent}
                  >
                    Save changes
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  Edit plan
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="border-line bg-surface-inset rounded-md border p-4">
          {isEditing ? (
            <CodeMirror
              value={editContent}
              onChange={setEditContent}
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
            <div className="markdown">
              <ReactMarkdown>{plan.markdownContent}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {panel && (
        <div className="border-line bg-surface-inset space-y-2 rounded-md border p-4">
          <p className="text-fg-secondary text-xs">
            {panel === 'changes' ? 'Describe the required changes:' : 'Reason for rejection:'}
          </p>
          <Textarea
            value={panelText}
            onChange={(e) => setPanelText(e.target.value)}
            placeholder={panel === 'changes' ? 'The plan needs to…' : 'Rejecting because…'}
            className="min-h-24"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={panel === 'changes' ? 'default' : 'outline'}
              className={
                panel === 'reject' ? 'bg-danger-bg border-danger-border text-danger' : undefined
              }
              onClick={submitPanel}
              disabled={isActioning || !panelText.trim()}
            >
              {panel === 'changes' ? 'Submit feedback' : 'Confirm rejection'}
            </Button>
            <Button size="sm" variant="ghost" onClick={closePanel}>
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
          <dl className="border-line bg-surface-inset grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded border p-3 text-xs">
            <dt className="text-fg-muted">Repository</dt>
            <dd className="text-fg font-mono">
              {plan.executionTarget?.repository ?? 'Not configured'}
            </dd>
            <dt className="text-fg-muted">Branch</dt>
            <dd className="text-fg font-mono">{plan.executionTarget?.branch ?? 'main'}</dd>
            <dt className="text-fg-muted">Tasks</dt>
            <dd className="text-fg font-mono">{plan.taskCount ?? 0}</dd>
          </dl>
          <Textarea
            value={approvalNotes}
            onChange={(event) => setApprovalNotes(event.target.value)}
            placeholder="Optional approval notes"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActioning}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitApproval} disabled={isActioning}>
              {isActioning ? 'Starting…' : 'Approve & execute'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
