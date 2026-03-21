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
import { PixelBadge } from '@/components/ui/pixel-badge';
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
    totalCostUsd?: number | null;
  };
  externalId?: string;
  dependsOn?: string[];
  userRole: UserRole;
  devMode?: boolean;
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

const STATUS_VARIANT: Record<
  TaskStatus,
  'default' | 'violet' | 'amber' | 'emerald' | 'red' | 'muted'
> = {
  todo: 'muted',
  in_progress: 'violet',
  blocked: 'amber',
  done: 'emerald',
  failed: 'red',
  skipped: 'muted',
};

const ROLE_RANK: Record<UserRole, number> = { viewer: 0, member: 1, admin: 2, owner: 3 };

function hasRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[required];
}

export function TaskRow({
  task,
  externalId,
  dependsOn,
  userRole,
  devMode,
  onUnblock,
  onOverride,
  onOpenDrawer,
  className,
}: TaskRowProps) {
  const [isOpen, setIsOpen] = useState(task.status === 'failed');
  const canUnblock = hasRole(userRole, 'member');
  const canOverride = hasRole(userRole, 'admin');

  const rowBorderClass =
    task.status === 'in_progress'
      ? 'border-l-2 border-accent-violet bg-accent-violet/5'
      : task.status === 'blocked'
        ? 'border-l-2 border-phosphor-amber bg-phosphor-amber/5'
        : 'border-l-2 border-transparent';

  return (
    <TooltipProvider>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={cn('rounded-sm', rowBorderClass, className)}>
          <CollapsibleTrigger asChild>
            <div className="hover:bg-bg-elevated flex h-9 cursor-pointer items-center gap-2 px-3 select-none">
              <PixelBadge
                variant={STATUS_VARIANT[task.status]}
                dot={task.status === 'in_progress'}
                className="w-16 justify-center"
              >
                <span className={cn(task.status === 'in_progress' && 'animate-blink')}>
                  {STATUS_CHAR[task.status]}
                </span>
                {task.status.replace('_', ' ')}
              </PixelBadge>
              <span className="bg-phosphor-amber/10 text-phosphor-amber shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-xs">
                {externalId ?? `T-${String(task.id).padStart(3, '0')}`}
              </span>
              {devMode && (
                <span className="text-text-muted font-mono text-[10px]">[id:{task.id}]</span>
              )}
              <span className="text-text-primary flex-1 truncate text-sm">{task.title}</span>
              {dependsOn && dependsOn.length > 0 && (
                <div className="flex shrink-0 gap-1">
                  {dependsOn.slice(0, 3).map((dep) => (
                    <span
                      key={dep}
                      className="text-text-muted bg-bg-elevated rounded px-1 font-mono text-[9px]"
                    >
                      +{dep}
                    </span>
                  ))}
                </div>
              )}
              {task.totalCostUsd && task.totalCostUsd > 0 && (
                <span className="text-text-muted shrink-0 font-mono text-[10px]">
                  ${Number(task.totalCostUsd).toFixed(4)}
                </span>
              )}
              {task.status === 'blocked' && task.errorMessage && (
                <span className="text-phosphor-amber max-w-48 truncate text-xs">
                  {task.errorMessage.slice(0, 60)}
                </span>
              )}
              {onOpenDrawer && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDrawer(task.id);
                      }}
                      aria-label="Open task details"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open task details</TooltipContent>
                </Tooltip>
              )}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Task actions</TooltipContent>
                </Tooltip>
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
                            {STATUS_CHAR[s]}
                            {s.replace('_', ' ')}
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
            <div className="text-text-secondary space-y-1 px-10 pb-3 text-sm">
              {task.description && <p>{task.description}</p>}
              {task.errorMessage && (
                <p className="text-status-red font-mono text-xs">{task.errorMessage}</p>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </TooltipProvider>
  );
}
