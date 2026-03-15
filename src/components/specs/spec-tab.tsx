'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import type { SpecStatus } from '@/components/specs/spec-editor';
import type { UserRole } from '@/db/schema';

interface SpecTabProps {
  spec: {
    id: number;
    content: string;
    status: SpecStatus;
    title: string;
    createdAt: string;
    updatedAt: string;
  };
  userRole: UserRole;
}

function statusBadgeClass(status: SpecStatus): string {
  switch (status) {
    case 'drafting':
      return 'text-[--text-muted]';
    case 'pending_plan':
      return 'text-[--phosphor-amber] animate-[blink_1s_ease-in-out_infinite]';
    case 'pending_approval':
      return 'text-[--phosphor-amber]';
    case 'executing':
      return 'text-[--accent-violet] animate-[blink_1s_ease-in-out_infinite]';
    case 'completed':
      return 'text-emerald-400';
    case 'stalled':
      return 'text-orange-400';
    case 'archived':
      return 'text-[--text-muted] opacity-50';
    default:
      return 'text-[--text-muted]';
  }
}

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export function SpecTab({ spec, userRole }: SpecTabProps): React.ReactElement {
  const canEdit = userRole !== 'viewer';

  const editButton = (
    <Button
      asChild={canEdit}
      variant="outline"
      size="sm"
      disabled={!canEdit}
      aria-disabled={!canEdit}
      className="flex items-center gap-1.5"
    >
      {canEdit ? (
        <Link href={`/specs/${spec.id}/edit`}>
          <Pencil className="h-3.5 w-3.5" />
          Edit Spec
        </Link>
      ) : (
        <span className="flex items-center gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Edit Spec
        </span>
      )}
    </Button>
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{spec.content}</ReactMarkdown>
        </div>
      </div>

      {/* Metadata sidebar */}
      <aside className="w-full shrink-0 space-y-4 lg:w-56">
        <div className="space-y-3 rounded-md border border-[--border-default] bg-[--bg-elevated] p-4">
          <div>
            <p className="mb-1 font-mono text-xs tracking-widest text-[--text-muted] uppercase">
              Status
            </p>
            <span className={`font-mono text-xs ${statusBadgeClass(spec.status)}`}>
              {spec.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div>
            <p className="mb-1 font-mono text-xs tracking-widest text-[--text-muted] uppercase">
              Word Count
            </p>
            <span className="font-mono text-xs text-[--text-secondary]">
              {wordCount(spec.content).toLocaleString()}
            </span>
          </div>

          <div>
            <p className="mb-1 font-mono text-xs tracking-widest text-[--text-muted] uppercase">
              Created
            </p>
            <span className="font-mono text-xs text-[--text-secondary]">
              {new Date(spec.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div>
            <p className="mb-1 font-mono text-xs tracking-widest text-[--text-muted] uppercase">
              Updated
            </p>
            <span className="font-mono text-xs text-[--text-secondary]">
              {new Date(spec.updatedAt).toLocaleDateString()}
            </span>
          </div>

          <TooltipProvider>
            {canEdit ? (
              editButton
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-block w-full">
                    {editButton}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Viewers cannot edit specs</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </aside>
    </div>
  );
}
