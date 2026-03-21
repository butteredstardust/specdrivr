'use client';

import { useState, useCallback } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Drawer } from 'vaul';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { XCircle, RefreshCw, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { PixelBadge, type PixelBadgeProps } from '@/components/ui/pixel-badge';
import { useTaskDrawer } from '@/components/shell/task-drawer-context';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { clientLogger } from '@/lib/logger-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TaskDrawerOverview } from './task-drawer-overview';
import { TaskDrawerAttempts } from './task-drawer-attempts';
import { TaskDrawerChanges } from './task-drawer-changes';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'failed' | 'skipped';

export interface Task {
  id: number;
  externalId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  orderIndex: number;
  dependsOn: string[];
  blockedReason: string | null;
  humanContext: string | null;
  verificationPassed: boolean;
  promptTokensUsed: number | null;
  completionTokensUsed: number | null;
  totalCostUsd: number | null;
  pullRequestUrl?: string | null;
}

const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; char: string; variant: PixelBadgeProps['variant'] }
> = {
  todo: { label: 'TODO', char: '○', variant: 'muted' },
  in_progress: { label: 'RUNNING', char: '▶', variant: 'violet' },
  blocked: { label: 'BLOCKED', char: '⚠', variant: 'amber' },
  done: { label: 'DONE', char: '✓', variant: 'emerald' },
  failed: { label: 'FAILED', char: '✕', variant: 'red' },
  skipped: { label: 'SKIPPED', char: '-', variant: 'muted' },
};

type DaemonExpression = 'idle' | 'working' | 'success' | 'blocked' | 'error';

function statusToExpression(status: TaskStatus): DaemonExpression {
  switch (status) {
    case 'todo':
      return 'idle';
    case 'in_progress':
      return 'working';
    case 'blocked':
      return 'blocked';
    case 'done':
      return 'success';
    case 'failed':
      return 'error';
    case 'skipped':
      return 'idle';
    default:
      return 'idle';
  }
}

export function TaskDrawer() {
  const { activeTaskId, closeDrawer } = useTaskDrawer();
  const { user, devMode } = useShell();
  const canManage = user.role === 'admin' || user.role === 'owner';

  const [localTask, setLocalTask] = useState<Task | null>(null);
  const [forceConfirmOpen, setForceConfirmOpen] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  const { data: polledTask, isLoading: _isLoading } = usePolling<Task>({
    url: activeTaskId ? `/api/v1/tasks/${activeTaskId}` : null,
    interval: 3000,
    stopWhen: (t) => !['todo', 'in_progress'].includes(t.status),
    onData: (t) => setLocalTask(t),
  });

  const task = localTask ?? polledTask;

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (!task) return;
      try {
        const res = await fetch(`/api/v1/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          clientLogger.error('Failed to update task status', errBody);
          toast.error('Failed to update status');
          return;
        }
        const json = await res.json();
        const updated = json.data !== undefined ? json.data : json;
        setLocalTask(updated);
        toast.success(`Task marked as ${newStatus}`);
      } catch (err) {
        clientLogger.error('Status change error', err);
        toast.error('Failed to update status');
      }
    },
    [task]
  );

  const handleMarkDone = useCallback(
    async (force: boolean) => {
      if (!task) return;
      if (task.status === 'done') return;

      if (!force && !task.verificationPassed) {
        setForceConfirmOpen(true);
        return;
      }

      setIsActioning(true);
      try {
        const res = await fetch(`/api/v1/tasks/${task.id}/complete`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        toast.success('Task marked as done.');
        setForceConfirmOpen(false);
        const updated = await res.json();
        setLocalTask(updated.data ?? updated);
      } catch (err) {
        clientLogger.error('Mark done error', err);
        toast.error('Failed to mark as done');
      } finally {
        setIsActioning(false);
      }
    },
    [task]
  );

  const handleRetry = useCallback(async () => {
    if (!task) return;
    setIsActioning(true);
    try {
      const res = await fetch(`/api/v1/tasks/${task.id}/unblock`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('Task queued for retry.');
    } catch (err) {
      clientLogger.error('Retry failed', err);
      toast.error('Failed to retry task');
    } finally {
      setIsActioning(false);
    }
  }, [task]);

  const handleMarkBlocked = useCallback(async () => {
    if (!task) return;
    await handleStatusChange('blocked');
  }, [task, handleStatusChange]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeDrawer();
        setLocalTask(null);
      }
    },
    [closeDrawer]
  );

  const DRAWER_TABS = ['overview', 'attempts', 'changes'] as const;

  return (
    <>
      <Drawer.Root open={!!activeTaskId} onOpenChange={handleOpenChange} direction="right">
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/60" />
          <Drawer.Content className="border-border-default bg-bg-surface fixed top-0 right-0 bottom-0 z-50 flex w-[640px] flex-col border-l outline-none">
            <Drawer.Title className="sr-only">{task?.title ?? 'Task'}</Drawer.Title>
            <Drawer.Description className="sr-only">
              {task ? `${task.externalId} — ${task.status}` : 'Loading task'}
            </Drawer.Description>
            {task && (
              <>
                {/* Header */}
                <div className="bg-bg-base border-border-default flex shrink-0 items-center gap-4 border-b px-6 py-5">
                  <PixelBadge variant="amber">{task.externalId}</PixelBadge>
                  <span className="text-text-primary flex-1 truncate text-lg font-semibold tracking-tight">
                    {task.title}
                  </span>
                  <DaemonMascot size={32} expression={statusToExpression(task.status)} />
                  <TooltipProvider>
                    {canManage ? (
                      <Select value={task.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="bg-bg-elevated h-8 w-40 border-none px-2 shadow-none focus:ring-0">
                          <SelectValue>
                            <PixelBadge
                              variant={TASK_STATUS_CONFIG[task.status].variant}
                              dot={task.status === 'in_progress'}
                              className="w-32 justify-center"
                            >
                              {TASK_STATUS_CONFIG[task.status].char}
                              {TASK_STATUS_CONFIG[task.status].label}
                            </PixelBadge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-bg-surface border-border-default">
                          {(Object.keys(TASK_STATUS_CONFIG) as Array<TaskStatus>).map((s) => (
                            <SelectItem key={s} value={s} className="focus:bg-bg-elevated py-2">
                              <PixelBadge
                                variant={TASK_STATUS_CONFIG[s].variant}
                                dot={s === 'in_progress'}
                                className="w-32 justify-center"
                              >
                                {TASK_STATUS_CONFIG[s].char}
                                {TASK_STATUS_CONFIG[s].label}
                              </PixelBadge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <PixelBadge
                              variant={TASK_STATUS_CONFIG[task.status].variant}
                              dot={task.status === 'in_progress'}
                              className="w-32 justify-center opacity-60"
                            >
                              {TASK_STATUS_CONFIG[task.status].char}
                              {TASK_STATUS_CONFIG[task.status].label}
                            </PixelBadge>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Requires Admin or Owner role</TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-text-muted hover:text-text-primary h-8 w-8 shrink-0 rounded-md"
                    onClick={closeDrawer}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
                  <TabsList className="border-border-default mx-6 mt-4 mb-0 h-auto shrink-0 justify-start gap-4 rounded-none border-b bg-transparent p-0">
                    {DRAWER_TABS.map((tab) => (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className="data-[state=active]:border-accent-violet data-[state=active]:text-text-primary data-[state=inactive]:text-text-muted hover:text-text-secondary rounded-none bg-transparent px-1 py-2.5 font-mono text-xs tracking-[0.08em] uppercase shadow-none transition-colors data-[state=active]:border-b-2 data-[state=inactive]:border-transparent"
                      >
                        {tab}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="flex-1 overflow-y-auto">
                    <TabsContent value="overview" className="mt-0 h-full">
                      <TaskDrawerOverview
                        task={task}
                        onRetry={handleRetry}
                        onTaskUpdated={setLocalTask}
                      />
                    </TabsContent>
                    <TabsContent value="attempts" className="mt-0 h-full">
                      <TaskDrawerAttempts taskId={task.id} taskStatus={task.status} />
                    </TabsContent>
                    <TabsContent value="changes" className="mt-0 h-full">
                      <TaskDrawerChanges taskId={task.id} />
                    </TabsContent>
                  </div>
                </Tabs>

                {/* Footer */}
                <DrawerFooter
                  task={task}
                  canManage={canManage}
                  devMode={devMode}
                  onRetry={handleRetry}
                  onMarkBlocked={handleMarkBlocked}
                  onMarkDone={() => handleMarkDone(false)}
                />
              </>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <AlertDialog open={forceConfirmOpen} onOpenChange={setForceConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force Mark as Done?</AlertDialogTitle>
            <AlertDialogDescription>
              This task has not passed automated verification. Marking it as done manually may cause
              issues with dependent tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActioning}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-status-red hover:bg-status-red/90"
              onClick={() => handleMarkDone(true)}
              disabled={isActioning}
            >
              Force Mark Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface DrawerFooterProps {
  task: Task;
  canManage: boolean;
  devMode: boolean;
  onRetry: () => Promise<void>;
  onMarkBlocked: () => Promise<void>;
  onMarkDone: () => Promise<void>;
}

function DrawerFooter({
  task,
  canManage,
  devMode,
  onRetry,
  onMarkBlocked,
  onMarkDone,
}: DrawerFooterProps) {
  const showRerun = ['failed', 'blocked', 'done'].includes(task.status);
  const [jsonOpen, setJsonOpen] = useState(false);

  return (
    <div className="bg-bg-elevated/50 border-border-default shrink-0 space-y-4 border-t px-6 py-5">
      <div className="flex items-center gap-3">
        {showRerun && (
          <Button variant="violet" size="sm" onClick={onRetry} className="h-8 gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            RE-RUN
          </Button>
        )}

        <TooltipProvider>
          {canManage ? (
            <Button
              variant="phosphor"
              size="sm"
              onClick={onMarkBlocked}
              className="h-8 gap-1.5"
              disabled={task.status === 'blocked'}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              MARK BLOCKED
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="phosphor"
                    size="sm"
                    disabled
                    className="h-8 cursor-not-allowed gap-1.5"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    MARK BLOCKED
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Requires Admin or Owner role</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>

        <TooltipProvider>
          {canManage ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkDone}
              className="border-status-emerald/50 text-status-emerald hover:bg-status-emerald/10 h-8 gap-1.5 font-mono text-[10px] tracking-widest uppercase transition-colors"
              disabled={task.status === 'done'}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              MARK DONE
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="h-8 cursor-not-allowed gap-1.5 font-mono text-[10px] tracking-widest uppercase opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    MARK DONE
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Requires Admin or Owner role</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>

      {(devMode || jsonOpen || (task.totalCostUsd && task.totalCostUsd > 0)) && (
        <div className="space-y-3">
          {(devMode || (task.totalCostUsd && task.totalCostUsd > 0)) && (
            <div className="text-text-muted flex items-center gap-4 font-mono text-[10px] tracking-[0.08em] uppercase">
              {devMode && (
                <>
                  <span>Prompt: {task.promptTokensUsed?.toLocaleString() ?? '---'}</span>
                  <span>Completion: {task.completionTokensUsed?.toLocaleString() ?? '---'}</span>
                </>
              )}
              {task.totalCostUsd != null && task.totalCostUsd > 0 && (
                <span>Cost: ${task.totalCostUsd.toFixed(4)}</span>
              )}
            </div>
          )}
          {devMode && (
            <Collapsible open={jsonOpen} onOpenChange={setJsonOpen}>
              <CollapsibleTrigger className="text-text-muted hover:text-text-secondary flex cursor-pointer items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase select-none">
                {jsonOpen ? 'Hide JSON' : 'Inspect JSON'}
                <ChevronRight
                  className={cn('h-3 w-3 transition-transform', jsonOpen && 'rotate-90')}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="bg-terminal-bg text-terminal-green border-border-subtle mt-2 overflow-auto rounded border p-3 font-mono text-[10px]">
                  {JSON.stringify(task, null, 2)}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
    </div>
  );
}
