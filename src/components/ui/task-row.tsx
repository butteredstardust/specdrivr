'use client';

import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'failed' | 'skipped';
type UserRole = 'viewer' | 'member' | 'admin' | 'owner';

interface TaskRowProps {
  task: {
    id: number;
    title: string;
    status: TaskStatus;
    description?: string | null;
    errorMessage?: string | null;
    orderIndex: number;
  };
  userRole: UserRole;
  onUnblock?: (taskId: number) => void;
  onOverride?: (taskId: number, newStatus: TaskStatus) => void;
  onOpenDrawer?: (taskId: number) => void;
  className?: string;
}

const STATUS_CHAR: Record<TaskStatus, string> = {
  todo: '○',
  in_progress: '▶',
  blocked: '⚠',
  done: '✓',
  failed: '✕',
  skipped: '-',
};

const STATUS_CLASS: Record<TaskStatus, string> = {
  todo: 'text-[--text-muted]',
  in_progress: 'text-[--accent-violet] animate-blink',
  blocked: 'text-[--phosphor-amber]',
  done: 'text-[--status-emerald]',
  failed: 'text-[--status-red]',
  skipped: 'text-[--text-muted] opacity-50',
};

const ROLE_RANK: Record<UserRole, number> = { viewer: 0, member: 1, admin: 2, owner: 3 };

function hasRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[required];
}

export function TaskRow({ task, userRole, onUnblock, onOverride, onOpenDrawer, className }: TaskRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const canUnblock = hasRole(userRole, 'member');
  const canOverride = hasRole(userRole, 'admin');

  const rowBorderClass =
    task.status === 'in_progress'
      ? 'border-l-2 border-[--accent-violet] bg-[--accent-violet]/5'
      : task.status === 'blocked'
        ? 'border-l-2 border-[--status-red]'
        : 'border-l-2 border-transparent';

  return (
    <TooltipProvider>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={cn('rounded-sm', rowBorderClass, className)}>
          <CollapsibleTrigger asChild>
            <div className="flex h-9 cursor-pointer items-center gap-2 px-3 select-none hover:bg-[--bg-elevated]">
              <span
                className={cn(
                  'w-4 shrink-0 text-center font-mono text-sm',
                  STATUS_CLASS[task.status]
                )}
              >
                {STATUS_CHAR[task.status]}
              </span>
              <span className="shrink-0 rounded-sm bg-[--phosphor-amber]/10 px-1.5 py-0.5 font-mono text-xs text-[--phosphor-amber]">
                T-{String(task.id).padStart(3, '0')}
              </span>
              <span className="flex-1 truncate text-sm text-[--text-primary]">{task.title}</span>
              {task.status === 'blocked' && task.errorMessage && (
                <span className="max-w-48 truncate text-xs text-[--phosphor-amber]">
                  {task.errorMessage.slice(0, 60)}
                </span>
              )}
              {onOpenDrawer && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => { e.stopPropagation(); onOpenDrawer(task.id); }}
                  aria-label="Open task details"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <DropdownMenuItem
                          disabled={!canUnblock}
                          onClick={() => canUnblock && onUnblock?.(task.id)}
                        >
                          Unblock
                        </DropdownMenuItem>
                      </span>
                    </TooltipTrigger>
                    {!canUnblock && <TooltipContent>Requires Member role or higher</TooltipContent>}
                  </Tooltip>
                  <DropdownMenuSub>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <DropdownMenuSubTrigger disabled={!canOverride}>
                            Override Status
                          </DropdownMenuSubTrigger>
                        </span>
                      </TooltipTrigger>
                      {!canOverride && (
                        <TooltipContent>Requires Admin role or higher</TooltipContent>
                      )}
                    </Tooltip>
                    {canOverride && (
                      <DropdownMenuSubContent>
                        {(
                          [
                            'todo',
                            'in_progress',
                            'blocked',
                            'done',
                            'failed',
                            'skipped',
                          ] as TaskStatus[]
                        ).map((s) => (
                          <DropdownMenuItem key={s} onClick={() => onOverride?.(task.id, s)}>
                            {STATUS_CHAR[s]} {s.replace('_', ' ')}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    )}
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="space-y-1 px-10 pb-3 text-sm text-[--text-secondary]">
              {task.description && <p>{task.description}</p>}
              {task.errorMessage && (
                <p className="font-mono text-xs text-[--status-red]">{task.errorMessage}</p>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </TooltipProvider>
  );
}
