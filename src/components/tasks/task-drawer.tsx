'use client'

import { useState, useCallback } from 'react'
import { Drawer } from 'vaul'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DaemonMascot } from '@/components/ui/daemon-mascot'
import { useTaskDrawer } from '@/components/shell/task-drawer-context'
import { useShell } from '@/components/shell/shell-context'
import { usePolling } from '@/hooks/use-polling'
import { clientLogger } from '@/lib/logger-client'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { TaskDrawerOverview } from './task-drawer-overview'
import { TaskDrawerAttempts } from './task-drawer-attempts'
import { TaskDrawerChanges } from './task-drawer-changes'

export interface Task {
  id: number
  externalId: string
  title: string
  status: 'todo' | 'in_progress' | 'blocked' | 'done' | 'failed' | 'skipped'
  description?: string | null
  blockedReason?: string | null
  humanContext?: string | null
  dependsOn: string[]
  totalCostUsd?: number | null
  promptTokensUsed?: number | null
  completionTokensUsed?: number | null
  planId: number
  specId?: number | null
  executionOrder: number
}

const TASK_STATUSES: Task['status'][] = [
  'todo',
  'in_progress',
  'blocked',
  'done',
  'failed',
  'skipped',
]

type DaemonExpression = 'idle' | 'working' | 'success' | 'blocked' | 'error'

function statusToExpression(status: Task['status']): DaemonExpression {
  switch (status) {
    case 'todo':
      return 'idle'
    case 'in_progress':
      return 'working'
    case 'blocked':
      return 'blocked'
    case 'done':
      return 'success'
    case 'failed':
      return 'error'
    case 'skipped':
      return 'idle'
    default:
      return 'idle'
  }
}

export function TaskDrawer() {
  const { activeTaskId, closeDrawer, openDrawer } = useTaskDrawer()
  const { user, devMode } = useShell()
  const canManage = user.role === 'admin' || user.role === 'owner'

  const [localTask, setLocalTask] = useState<Task | null>(null)
  const [forceConfirmOpen, setForceConfirmOpen] = useState(false)

  const { data: polledTask, isLoading } = usePolling<Task>({
    url: activeTaskId ? `/api/v1/tasks/${activeTaskId}` : null,
    interval: 3000,
    stopWhen: (t) => !['todo', 'in_progress'].includes(t.status),
    onData: (t) => setLocalTask(t),
  })

  const task = localTask ?? polledTask

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      if (!task) return
      try {
        const res = await fetch(`/api/v1/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        })
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          clientLogger.error('Failed to update task status', errBody)
          toast.error('Failed to update status')
          return
        }
        const json = await res.json()
        const updated = json.data !== undefined ? json.data : json
        setLocalTask(updated)
        toast.success(`Status updated to ${newStatus}`)
      } catch (err) {
        clientLogger.error('Status change error', err)
        toast.error('Failed to update status')
      }
    },
    [task]
  )

  const handleRetry = useCallback(async () => {
    if (!task) return
    try {
      const res = await fetch(`/api/v1/tasks/${task.id}/retry`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        toast.error('Retry not yet available')
        return
      }
      toast.success('Retry initiated')
      const json = await res.json().catch(() => ({}))
      const updated = json.data !== undefined ? json.data : json
      if (updated?.id) setLocalTask(updated)
    } catch (err) {
      clientLogger.error('Retry error', err)
      toast.error('Retry not yet available')
    }
  }, [task])

  const handleMarkDone = useCallback(
    async (force = false) => {
      if (!task) return
      try {
        const body: Record<string, unknown> = { status: 'done' }
        if (force) body.forceDone = true

        const res = await fetch(`/api/v1/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        })

        if (res.status === 422 && !force) {
          setForceConfirmOpen(true)
          return
        }

        if (!res.ok) {
          toast.error('Failed to mark as done')
          return
        }

        const json = await res.json()
        const updated = json.data !== undefined ? json.data : json
        setLocalTask(updated)
        setForceConfirmOpen(false)
        toast.success('Task marked as done')
      } catch (err) {
        clientLogger.error('Mark done error', err)
        toast.error('Failed to mark as done')
      }
    },
    [task]
  )

  const handleMarkBlocked = useCallback(async () => {
    if (!task) return
    await handleStatusChange('blocked')
  }, [task, handleStatusChange])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeDrawer()
        setLocalTask(null)
      }
    },
    [closeDrawer]
  )

  const DRAWER_TABS = ['overview', 'attempts', 'changes'] as const

  return (
    <>
      <Drawer.Root
        open={!!activeTaskId}
        onOpenChange={handleOpenChange}
        direction="right"
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 z-40" />
          <Drawer.Content className="fixed right-0 top-0 bottom-0 w-[640px] z-50 bg-[--bg-surface] border-l border-[--border-default] flex flex-col outline-none">
            {task && (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[--border-default] shrink-0">
                  <span className="rounded-sm bg-[--phosphor-amber]/10 px-1.5 py-0.5 font-mono text-xs text-[--phosphor-amber]">
                    {task.externalId}
                  </span>
                  <span className="flex-1 truncate text-base font-medium text-[--text-primary]">
                    {task.title}
                  </span>
                  <DaemonMascot
                    size={24}
                    expression={statusToExpression(task.status)}
                  />
                  <TooltipProvider>
                    {canManage ? (
                      <Select
                        value={task.status}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Select disabled value={task.status}>
                              <SelectTrigger className="h-7 w-32 text-xs opacity-50 cursor-not-allowed">
                                <SelectValue />
                              </SelectTrigger>
                            </Select>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Requires Admin or Owner role
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={closeDrawer}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tabs */}
                <Tabs
                  defaultValue="overview"
                  className="flex-1 flex flex-col min-h-0"
                >
                  <TabsList className="shrink-0 mx-5 mt-3 mb-0 justify-start gap-0 bg-transparent border-b border-[--border-default] rounded-none h-auto p-0">
                    {DRAWER_TABS.map((tab) => (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className="font-mono text-xs tracking-widest uppercase px-4 py-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[--accent-violet] data-[state=active]:text-[--text-primary] data-[state=inactive]:text-[--text-muted] bg-transparent shadow-none"
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
                      <TaskDrawerAttempts
                        taskId={task.id}
                        taskStatus={task.status}
                      />
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
            {!task && isLoading && (
              <div className="flex-1 flex items-center justify-center">
                <span className="font-mono text-xs text-[--text-muted]">
                  Loading...
                </span>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <AlertDialog open={forceConfirmOpen} onOpenChange={setForceConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force mark as done?</AlertDialogTitle>
            <AlertDialogDescription>
              This task has unmet conditions. Forcing it to done may leave
              dependencies in an inconsistent state. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleMarkDone(true)}>
              Force Done
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// DrawerFooter (inline)
// ---------------------------------------------------------------------------

interface DrawerFooterProps {
  task: Task
  canManage: boolean
  devMode: boolean
  onRetry: () => void
  onMarkBlocked: () => void
  onMarkDone: () => void
}

function DrawerFooter({
  task,
  canManage,
  devMode,
  onRetry,
  onMarkBlocked,
  onMarkDone,
}: DrawerFooterProps) {
  const showRerun = ['failed', 'blocked', 'done'].includes(task.status)

  return (
    <div className="border-t border-[--border-default] px-5 py-3 shrink-0 space-y-3">
      <div className="flex items-center gap-2">
        {showRerun && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            RE-RUN
          </Button>
        )}

        <TooltipProvider>
          {canManage ? (
            <Button variant="outline" size="sm" onClick={onMarkBlocked}>
              MARK BLOCKED
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="cursor-not-allowed"
                  >
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
            <Button variant="outline" size="sm" onClick={onMarkDone}>
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
                    className="cursor-not-allowed"
                  >
                    MARK DONE
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Requires Admin or Owner role</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>

      {devMode && (
        <div className="flex items-center gap-4 font-mono text-[10px] text-[--text-muted]">
          <span>
            Prompt: {task.promptTokensUsed?.toLocaleString() ?? '---'}
          </span>
          <span>
            Completion: {task.completionTokensUsed?.toLocaleString() ?? '---'}
          </span>
          <span>
            Cost: $
            {task.totalCostUsd != null ? task.totalCostUsd.toFixed(4) : '---'}
          </span>
        </div>
      )}
    </div>
  )
}
