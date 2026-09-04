'use client';

import { useState, useCallback } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Drawer } from 'vaul';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { XCircle, RefreshCw, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { overrideTaskStatusAction, retryTaskAction, unblockTaskAction } from '@/actions/tasks';
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
import { StatusIcon, type Status } from '@/components/ui/status-icon';
import { Badge } from '@/components/ui/badge';
import { EntityId } from '@/components/ui/entity-id';
import { TASK_STATUS } from '@/lib/ui-status';
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
  executionOrder: number;
  dependsOn: string[];
  blockedReason: string | null;
  humanContext: string | null;
  verificationPassed: boolean;
  promptTokensUsed: number | null;
  completionTokensUsed: number | null;
  totalCostUsd: number | null;
  pullRequestUrl?: string | null;
}

const TASK_STATUS_CONFIG = TASK_STATUS;

function statusToExpression(status: TaskStatus): Status {
  return TASK_STATUS[status]?.status ?? 'idle';
}

export function TaskDrawer() {
  const { activeTaskId, closeDrawer } = useTaskDrawer();
  const { user, devMode } = useShell();
  const canManage = user.role === 'admin' || user.role === 'owner';

  const [localTask, setLocalTask] = useState<Task | null>(null);
  const [forceConfirmOpen, setForceConfirmOpen] = useState(false);
  const [forceReason, setForceReason] = useState('');
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

      if (!force) {
        setForceConfirmOpen(true);
        return;
      }

      if (!forceReason.trim()) {
        toast.error('Add a reason for the manual completion.');
        return;
      }
      setIsActioning(true);
      try {
        const formData = new FormData();
        formData.set('id', String(task.id));
        formData.set('status', 'done');
        formData.set('notes', forceReason.trim());
        const result = await overrideTaskStatusAction(formData);
        if (!result.success || !result.data) {
          throw new Error(result.error?.message ?? 'Manual completion failed');
        }
        toast.success('Task marked as done.');
        setForceConfirmOpen(false);
        setForceReason('');
        setLocalTask(result.data as Task);
      } catch (err) {
        clientLogger.error('Mark done error', err);
        toast.error('Failed to mark as done');
      } finally {
        setIsActioning(false);
      }
    },
    [task, forceReason]
  );

  const handleRetry = useCallback(
    async (humanContext?: string) => {
      if (!task) return;
      setIsActioning(true);
      try {
        const formData = new FormData();
        formData.set('id', String(task.id));
        const result =
          task.status === 'blocked'
            ? await (async () => {
                formData.set('humanContext', humanContext ?? '');
                return unblockTaskAction(formData);
              })()
            : await retryTaskAction(formData);
        if (!result.success || !result.data) {
          throw new Error(result.error?.message ?? 'Retry failed');
        }
        setLocalTask(result.data as Task);
        toast.success('Task queued for retry.');
      } catch (err) {
        clientLogger.error('Retry failed', err);
        toast.error('Failed to retry task');
      } finally {
        setIsActioning(false);
      }
    },
    [task]
  );

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
          <Drawer.Content className="border-line bg-surface-raised fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-[640px] flex-col border-l outline-none">
            <Drawer.Title className="sr-only">{task?.title ?? 'Task'}</Drawer.Title>
            <Drawer.Description className="sr-only">
              {task ? `${task.externalId} — ${task.status}` : 'Loading task'}
            </Drawer.Description>
            {task && (
              <>
                {/* Header */}
                <div className="bg-surface-base border-line flex shrink-0 items-center gap-4 border-b px-6 py-5">
                  <EntityId chip>{task.externalId}</EntityId>
                  <span className="text-fg flex-1 truncate text-lg font-semibold tracking-tight">
                    {task.title}
                  </span>
                  <StatusIcon size={20} status={statusToExpression(task.status)} />
                  <TooltipProvider>
                    {canManage ? (
                      <Select value={task.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="bg-surface-inset h-8 w-40 border-none px-2 shadow-none focus:ring-0">
                          <SelectValue>
                            <Badge
                              variant={TASK_STATUS_CONFIG[task.status].variant}
                              dot={task.status === 'in_progress'}
                              className="w-32 justify-center"
                            >
                              {TASK_STATUS_CONFIG[task.status].label}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-surface-raised border-line">
                          {(Object.keys(TASK_STATUS_CONFIG) as Array<TaskStatus>)
                            .filter((s) => s !== 'done')
                            .map((s) => (
                              <SelectItem key={s} value={s} className="focus:bg-surface-inset py-2">
                                <Badge
                                  variant={TASK_STATUS_CONFIG[s].variant}
                                  dot={s === 'in_progress'}
                                  className="w-32 justify-center"
                                >
                                  {TASK_STATUS_CONFIG[s].label}
                                </Badge>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Badge
                              variant={TASK_STATUS_CONFIG[task.status].variant}
                              dot={task.status === 'in_progress'}
                              className="w-32 justify-center opacity-60"
                            >
                              {TASK_STATUS_CONFIG[task.status].label}
                            </Badge>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Requires Admin or Owner role</TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-fg-muted hover:text-fg h-8 w-8 shrink-0 rounded-md"
                    onClick={closeDrawer}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
                  <TabsList className="border-line mx-6 mt-4 mb-0 h-auto shrink-0 justify-start gap-4 rounded-none border-b bg-transparent p-0">
                    {DRAWER_TABS.map((tab) => (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className="data-[state=active]:border-accent data-[state=active]:text-fg data-[state=inactive]:text-fg-muted hover:text-fg-secondary rounded-none bg-transparent px-1 py-2.5 font-mono text-xs tracking-[0.08em] uppercase shadow-none transition-colors data-[state=active]:border-b-2 data-[state=inactive]:border-transparent"
                      >
                        {tab}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="flex-1 overflow-y-auto">
                    <TabsContent value="overview" className="mt-0 h-full">
                      <TaskDrawerOverview task={task} onRetry={handleRetry} />
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
              Manual completion bypasses the agent workflow. Record why this transition is safe for
              the audit trail.
            </AlertDialogDescription>
            <Textarea
              value={forceReason}
              onChange={(event) => setForceReason(event.target.value)}
              placeholder="Explain why this task is safe to complete manually"
              className="mt-3 min-h-24"
            />
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActioning}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger hover:bg-danger/90"
              onClick={() => handleMarkDone(true)}
              disabled={isActioning || !forceReason.trim()}
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
  onRetry: (humanContext?: string) => Promise<void>;
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
  const showRerun = ['failed', 'done'].includes(task.status);
  const [jsonOpen, setJsonOpen] = useState(false);

  return (
    <div className="bg-surface-inset/50 border-line shrink-0 space-y-4 border-t px-6 py-5">
      <div className="flex items-center gap-3">
        {showRerun && (
          <Button variant="info" size="sm" onClick={() => void onRetry()} className="h-8 gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            RE-RUN
          </Button>
        )}

        <TooltipProvider>
          {canManage ? (
            <Button
              variant="warning"
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
                    variant="warning"
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
              className="border-success/50 text-success hover:bg-success/10 h-8 gap-1.5 font-mono text-[10px] tracking-widest uppercase transition-colors"
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
            <div className="text-fg-muted flex items-center gap-4 font-mono text-[10px] tracking-[0.08em] uppercase">
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
              <CollapsibleTrigger className="text-fg-muted hover:text-fg-secondary flex cursor-pointer items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] uppercase select-none">
                {jsonOpen ? 'Hide JSON' : 'Inspect JSON'}
                <ChevronRight
                  className={cn('h-3 w-3 transition-transform', jsonOpen && 'rotate-90')}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="bg-log-bg text-success border-line-subtle mt-2 overflow-auto rounded border p-3 font-mono text-[10px]">
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
