'use client';

import { useState, useCallback } from 'react';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
import { Button } from '@/components/ui/button';
import { StatusIcon } from '@/components/ui/status-icon';
import { Loader2, Download } from 'lucide-react';
import type { UsageSnapshotSelect } from '@/db/schema';

interface UsageSummary {
  totalSessions: number;
  totalTasks: number;
  totalTokens: number;
  totalCostUsd: number;
}

interface UsagePayload {
  snapshots: UsageSnapshotSelect[];
  summary: UsageSummary;
}

interface UsageSectionProps {
  projectId: number;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-line bg-surface-raised flex flex-col gap-1 rounded-lg border p-4">
      <span className="text-fg-muted font-mono text-xs">{label}</span>
      <span className="text-fg font-mono text-lg">{value}</span>
    </div>
  );
}

export function UsageSection({ projectId }: UsageSectionProps) {
  const [snapshots, setSnapshots] = useState<UsageSnapshotSelect[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);

  const stopWhen = useCallback((data: UsagePayload) => {
    setSnapshots(data.snapshots);
    setSummary(data.summary);
    return true;
  }, []);

  const onError = useCallback((err: Error) => {
    clientLogger.error('Failed to load usage data', err);
  }, []);

  const { isLoading, error, restart } = usePolling<UsagePayload>({
    url: `/api/v1/projects/${projectId}/usage`,
    stopWhen,
    onError,
  });

  const handleExport = () => {
    const header = 'Date,Sessions,Tasks,Tokens,Cost\n';
    const rows = snapshots
      .map((s) => {
        const tokens = s.promptTokens + s.completionTokens;
        return `${formatDate(s.date)},${s.sessionsRun},${s.tasksExecuted},${tokens},${Number(s.estimatedCostUsd).toFixed(4)}`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-${projectId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="text-fg-muted flex items-center gap-2">
        <Loader2 className="size-3 animate-spin" />
        <span className="font-mono text-xs">Loading usage data…</span>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-danger font-mono text-xs">Failed to load usage data.</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={restart}
          className="text-fg-muted hover:text-fg h-auto px-0 font-mono text-xs underline hover:bg-transparent"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!summary || snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <StatusIcon size={24} status="idle" />
        <p className="text-fg-muted font-mono text-sm">No usage data yet.</p>
        <p className="text-fg-muted font-mono text-xs">
          Usage will appear here once execution begins.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total Sessions" value={String(summary.totalSessions)} />
        <SummaryCard label="Tasks Completed" value={String(summary.totalTasks)} />
        <SummaryCard label="Tokens Used" value={formatTokens(summary.totalTokens)} />
        <SummaryCard label="Est. Cost" value={`$${Number(summary.totalCostUsd).toFixed(2)}`} />
      </div>

      {/* Export button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2 font-mono text-xs"
        >
          <Download className="size-3" />
          Export CSV
        </Button>
      </div>

      {/* Daily breakdown table */}
      <div className="border-line overflow-x-auto rounded-lg border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-line bg-surface-raised border-b">
              <th className="text-fg-muted px-4 py-2 font-mono text-xs">Date</th>
              <th className="text-fg-muted px-4 py-2 font-mono text-xs">Sessions</th>
              <th className="text-fg-muted px-4 py-2 font-mono text-xs">Tasks</th>
              <th className="text-fg-muted px-4 py-2 font-mono text-xs">Tokens</th>
              <th className="text-fg-muted px-4 py-2 font-mono text-xs">Cost</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((s) => (
              <tr
                key={s.id}
                className="border-line hover:bg-surface-inset/50 border-b last:border-0"
              >
                <td className="text-fg px-4 py-2.5 font-mono text-xs">{formatDate(s.date)}</td>
                <td className="text-fg px-4 py-2.5 font-mono text-xs">{s.sessionsRun}</td>
                <td className="text-fg px-4 py-2.5 font-mono text-xs">{s.tasksExecuted}</td>
                <td className="text-fg px-4 py-2.5 font-mono text-xs">
                  {formatTokens(s.promptTokens + s.completionTokens)}
                </td>
                <td className="text-fg px-4 py-2.5 font-mono text-xs">
                  ${Number(s.estimatedCostUsd).toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
