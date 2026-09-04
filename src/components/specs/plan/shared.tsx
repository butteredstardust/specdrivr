'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { UserRole } from '@/db/schema';

export type PlanStatus =
  | 'pending_approval'
  | 'changes_requested'
  | 'approved'
  | 'executing'
  | 'completed'
  | 'rejected'
  | 'abandoned';

export interface Plan {
  id: number;
  markdownContent: string;
  status: PlanStatus;
  reviewerFeedback?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  taskCount?: number | null;
  executionTarget?: { repository: string; branch: string };
}

export function timeAgo(dateStr: string | null | undefined): string {
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

export function hasRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[required];
}

export function ElapsedTimer({ startedAt }: { startedAt: Date }): React.ReactElement {
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
    <span className="text-fg-muted font-mono text-xs" aria-live="polite">
      {mins > 0 ? `${mins}m ` : ''}
      {secs}s
    </span>
  );
}

interface GatedButtonProps extends React.ComponentProps<typeof Button> {
  /** When false the button renders disabled inside a tooltip explaining why. */
  allowed: boolean;
  /** Role named in the tooltip, e.g. "Admin". */
  requires: string;
}

/**
 * A button that explains its own disabled state.
 *
 * Every action on this tab was written twice — once enabled, once wrapped in a
 * tooltip with `disabled aria-disabled` — which is why the file was 682 lines.
 * A disabled button does not fire pointer events, so the tooltip needs a
 * focusable wrapper to hang off; that detail lives here now instead of at six
 * call sites.
 */
export function GatedButton({ allowed, requires, children, ...props }: GatedButtonProps) {
  if (allowed) {
    return <Button {...props}>{children}</Button>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>
          <Button {...props} disabled aria-disabled>
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>Requires {requires} role or higher</TooltipContent>
    </Tooltip>
  );
}

/** The plan body. Styling comes from the `.markdown` rules in globals.css. */
export function PlanDocument({ content }: { content: string }) {
  return (
    <div className="border-line bg-surface-inset rounded-md border p-4">
      <div className="markdown">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
