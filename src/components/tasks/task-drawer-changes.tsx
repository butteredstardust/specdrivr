'use client'

import { usePolling } from '@/hooks/use-polling'
import { DiffViewer } from '@/components/ui/diff-viewer'
import { DaemonMascot } from '@/components/ui/daemon-mascot'

interface FileChange {
  filename: string
  patch: string
  additions: number
  deletions: number
  status: 'added' | 'modified' | 'deleted' | 'renamed'
}

interface TaskDrawerChangesProps {
  taskId: number
}

export function TaskDrawerChanges({ taskId }: TaskDrawerChangesProps) {
  const { data: changes, isLoading } = usePolling<FileChange[]>({
    url: `/api/v1/tasks/${taskId}/changes`,
    interval: 10_000,
    stopWhen: (data) => Array.isArray(data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="font-mono text-xs text-[--text-muted]">
          Loading changes...
        </span>
      </div>
    )
  }

  if (!changes || changes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8">
        <DaemonMascot size={32} expression="idle" />
        <span className="font-mono text-xs text-[--text-muted]">
          No file changes yet.
        </span>
      </div>
    )
  }

  return (
    <div className="h-full">
      <DiffViewer files={changes} />
    </div>
  )
}
