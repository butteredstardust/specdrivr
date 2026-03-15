'use client';

import { useState, useEffect } from 'react';
import { clientLogger } from '@/lib/logger-client';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { DiffViewer } from '@/components/ui/diff-viewer';

interface DiffFile {
  filename: string;
  patch: string;
  additions: number;
  deletions: number;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
}

interface ChangesResponse {
  files: DiffFile[];
}

interface ChangesTabProps {
  specId: number;
}

export function ChangesTab({ specId }: ChangesTabProps): React.ReactElement {
  const [files, setFiles] = useState<DiffFile[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await fetch(`/api/v1/specs/${specId}/changes`, { credentials: 'include' });
        if (!res.ok) {
          // Treat non-200 (including 404) as empty state
          if (!cancelled) setFiles([]);
          return;
        }
        const json: ChangesResponse = await res.json();
        if (!cancelled) {
          setFiles(Array.isArray(json.files) ? json.files : []);
        }
      } catch (err) {
        clientLogger.error('ChangesTab: failed to fetch changes', err);
        if (!cancelled) setFetchError('Failed to load changes.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [specId]);

  if (isLoading) {
    return (
      <div className="text-text-muted py-8 text-center font-mono text-xs">Loading changes…</div>
    );
  }

  if (fetchError) {
    return <p className="text-text-muted py-8 text-center font-mono text-xs">{fetchError}</p>;
  }

  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <DaemonMascot size={48} expression="idle" />
        <p className="text-text-secondary font-mono text-sm">No changes recorded yet.</p>
      </div>
    );
  }

  const totalAdditions = files.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = files.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className="space-y-3">
      <p className="text-text-muted font-mono text-xs">
        {files.length} {files.length === 1 ? 'file' : 'files'} changed,{' '}
        <span className="text-emerald-400">+{totalAdditions} insertions</span>,{' '}
        <span className="text-status-red">-{totalDeletions} deletions</span>
      </p>
      <div className="border-border-default min-h-96 overflow-hidden rounded-md border">
        <DiffViewer files={files} />
      </div>
    </div>
  );
}
