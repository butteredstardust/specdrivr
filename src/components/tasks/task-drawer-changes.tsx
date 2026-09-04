'use client';

import { usePolling } from '@/hooks/use-polling';
import { DiffViewer } from '@/components/ui/diff-viewer';
import { StatusIcon } from '@/components/ui/status-icon';

interface FileChange {
  filename: string;
  patch: string;
  additions: number;
  deletions: number;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
}

interface TaskDrawerChangesProps {
  taskId: number;
}

export function TaskDrawerChanges({ taskId }: TaskDrawerChangesProps) {
  const { data: changes, isLoading } = usePolling<FileChange[]>({
    url: `/api/v1/tasks/${taskId}/changes`,
    interval: 10_000,
    stopWhen: (data) => Array.isArray(data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="text-fg-muted font-mono text-xs">Loading changes...</span>
      </div>
    );
  }

  if (!changes || changes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <StatusIcon size={24} status="idle" />
        <span className="text-fg-secondary font-mono text-sm">No file changes yet.</span>
      </div>
    );
  }

  return (
    <div className="h-full">
      <DiffViewer files={changes} />
    </div>
  );
}
