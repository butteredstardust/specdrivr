'use client'

import { useState } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { TerminalLog } from '@/components/ui/terminal-log'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { DaemonMascot } from '@/components/ui/daemon-mascot'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Attempt {
  id: number
  seq: number
  status: 'running' | 'completed' | 'failed'
  logLines: string[]
  startedAt?: string | null
  completedAt?: string | null
  durationMs?: number | null
}

interface TaskDrawerAttemptsProps {
  taskId: number
  taskStatus: string
}

const statusBadgeClass: Record<Attempt['status'], string> = {
  running: 'bg-[--accent-violet]/10 text-[--accent-violet]',
  completed: 'bg-emerald-500/10 text-emerald-400',
  failed: 'bg-[--status-red]/10 text-[--status-red]',
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const secs = Math.floor(ms / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  const remSecs = secs % 60
  return `${mins}m ${remSecs}s`
}

export function TaskDrawerAttempts({
  taskId,
  taskStatus,
}: TaskDrawerAttemptsProps) {
  const shouldPoll = taskStatus === 'in_progress'

  const { data: attempts, isLoading } = usePolling<Attempt[]>({
    url: `/api/v1/tasks/${taskId}/attempts`,
    interval: 3000,
    stopWhen: () => !shouldPoll,
  })

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="font-mono text-xs text-[--text-muted]">
          Loading attempts...
        </span>
      </div>
    )
  }

  if (!attempts || attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8">
        <DaemonMascot size={32} expression="idle" />
        <span className="font-mono text-xs text-[--text-muted]">
          No attempts yet.
        </span>
      </div>
    )
  }

  return (
    <div className="p-5 space-y-3">
      {attempts.map((attempt, index) => {
        const isLatestRunning = index === 0 && attempt.status === 'running'
        const isOpen = isLatestRunning || expandedIds.has(attempt.id)

        return (
          <Collapsible
            key={attempt.id}
            open={isOpen}
            onOpenChange={() => toggleExpanded(attempt.id)}
          >
            <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-md border border-[--border-default] px-3 py-2 hover:bg-[--bg-elevated] transition-colors">
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 text-[--text-muted] transition-transform',
                  isOpen && 'rotate-90'
                )}
              />
              <span className="font-mono text-xs text-[--text-primary]">
                Attempt #{attempt.seq}
              </span>
              <span
                className={cn(
                  'rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase',
                  statusBadgeClass[attempt.status]
                )}
              >
                {attempt.status}
              </span>
              {attempt.durationMs != null && (
                <span className="ml-auto font-mono text-[10px] text-[--text-muted]">
                  {formatDuration(attempt.durationMs)}
                </span>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <TerminalLog
                lines={attempt.logLines ?? []}
                maxHeight="320px"
                autoScroll={attempt.status === 'running'}
              />
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </div>
  )
}
