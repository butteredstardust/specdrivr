'use client';

import { useCallback, useState } from 'react';
import { XCircle } from 'lucide-react';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { TaskDrawerOverview } from './task-drawer-overview';
import { TaskDrawerAttempts } from './task-drawer-attempts';
import { TaskDrawerChanges } from './task-drawer-changes';
import { TaskDrawerFooter } from './task-drawer-footer';
import { useTaskActions } from './use-task-actions';

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

const DRAWER_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'attempts', label: 'Attempts' },
  { value: 'changes', label: 'Changes' },
] as const;

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

  const { data: polledTask } = usePolling<Task>({
    url: activeTaskId ? `/api/v1/tasks/${activeTaskId}` : null,
    interval: 3000,
    stopWhen: (t) => !['todo', 'in_progress'].includes(t.status),
    onData: (t) => setLocalTask(t),
  });

  const task = localTask ?? polledTask;

  const { isActioning, changeStatus, forceMarkDone, retry } = useTaskActions(task, setLocalTask);

  const handleForceMarkDone = useCallback(async () => {
    if (await forceMarkDone(forceReason)) {
      setForceConfirmOpen(false);
      setForceReason('');
    }
  }, [forceMarkDone, forceReason]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeDrawer();
        setLocalTask(null);
      }
    },
    [closeDrawer]
  );

  return (
    <>
      <Drawer open={!!activeTaskId} onOpenChange={handleOpenChange}>
        <DrawerContent>
          <DrawerTitle className="sr-only">{task?.title ?? 'Task'}</DrawerTitle>
          <DrawerDescription className="sr-only">
            {task ? `${task.externalId} — ${task.status}` : 'Loading task'}
          </DrawerDescription>
          {task && (
            <>
              <div className="bg-surface-base border-line flex shrink-0 items-center gap-4 border-b px-6 py-5">
                <EntityId chip>{task.externalId}</EntityId>
                <span className="text-fg flex-1 truncate text-lg font-semibold tracking-tight">
                  {task.title}
                </span>
                <StatusIcon size={20} status={statusToExpression(task.status)} />
                <TooltipProvider>
                  {canManage ? (
                    <Select value={task.status} onValueChange={changeStatus}>
                      <SelectTrigger className="bg-surface-inset h-8 w-40 border-none px-2 shadow-none">
                        <SelectValue>
                          <Badge
                            variant={TASK_STATUS[task.status].variant}
                            dot={task.status === 'in_progress'}
                            className="w-32 justify-center"
                          >
                            {TASK_STATUS[task.status].label}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-surface-raised border-line">
                        {/* `done` is absent by design: manual completion needs a
                            recorded reason, so it goes through the footer's
                            confirmation rather than this menu. */}
                        {(Object.keys(TASK_STATUS) as Array<TaskStatus>)
                          .filter((s) => s !== 'done')
                          .map((s) => (
                            <SelectItem key={s} value={s} className="focus:bg-surface-inset py-2">
                              <Badge
                                variant={TASK_STATUS[s].variant}
                                dot={s === 'in_progress'}
                                className="w-32 justify-center"
                              >
                                {TASK_STATUS[s].label}
                              </Badge>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={0}>
                          <Badge
                            variant={TASK_STATUS[task.status].variant}
                            dot={task.status === 'in_progress'}
                            className="w-32 justify-center"
                          >
                            {TASK_STATUS[task.status].label}
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
                  aria-label="Close task"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
                <TabsList className="border-line mx-6 mt-4 mb-0 h-auto shrink-0 justify-start gap-4 rounded-none border-b bg-transparent p-0">
                  {DRAWER_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="data-[state=active]:border-accent data-[state=active]:text-fg data-[state=inactive]:text-fg-muted hover:text-fg-secondary rounded-none bg-transparent px-1 py-2.5 text-xs shadow-none transition-colors data-[state=active]:border-b-2 data-[state=inactive]:border-transparent"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="overview" className="mt-0 h-full">
                    <TaskDrawerOverview task={task} onRetry={retry} />
                  </TabsContent>
                  <TabsContent value="attempts" className="mt-0 h-full">
                    <TaskDrawerAttempts taskId={task.id} taskStatus={task.status} />
                  </TabsContent>
                  <TabsContent value="changes" className="mt-0 h-full">
                    <TaskDrawerChanges taskId={task.id} />
                  </TabsContent>
                </div>
              </Tabs>

              <TaskDrawerFooter
                task={task}
                canManage={canManage}
                devMode={devMode}
                onRetry={retry}
                onMarkBlocked={() => changeStatus('blocked')}
                onMarkDone={() => setForceConfirmOpen(true)}
              />
            </>
          )}
        </DrawerContent>
      </Drawer>

      <AlertDialog open={forceConfirmOpen} onOpenChange={setForceConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force mark as done?</AlertDialogTitle>
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
              onClick={(event) => {
                // Keep the dialog open on failure — the default action closes it.
                event.preventDefault();
                void handleForceMarkDone();
              }}
              disabled={isActioning || !forceReason.trim()}
            >
              Force mark done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
