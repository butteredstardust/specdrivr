'use client';

import { useState, useCallback } from 'react';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
import { Button } from '@/components/ui/button';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
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
    <div className="flex flex-col gap-1 rounded-lg border border-[--border-default] bg-[--bg-surface] p-4">
      <span className="font-mono text-xs text-[--text-muted]">{label}</span>
      <span className="font-mono text-lg text-[--text-primary]">{value}</span>
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
        return `${formatDate(s.date)},${s.sessionsRun},${s.tasksExecuted},${tokens},${s.estimatedCostUsd.toFixed(4)}`;
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
      <div className="flex items-center gap-2 text-[--text-muted]">
        <Loader2 className="size-3 animate-spin" />
        <span className="font-mono text-xs">Loading usage data…</span>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-[--status-red]">Failed to load usage data.</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={restart}
          className="h-auto px-0 font-mono text-xs text-[--text-muted] underline hover:bg-transparent hover:text-[--text-primary]"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!summary || snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <DaemonMascot size={48} expression="idle" />
        <p className="font-mono text-sm text-[--text-muted]">No usage data yet.</p>
        <p className="font-mono text-xs text-[--text-muted]">
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
        <SummaryCard label="Tasks Run" value={String(summary.totalTasks)} />
        <SummaryCard label="Tokens Used" value={formatTokens(summary.totalTokens)} />
        <SummaryCard label="Est. Cost" value={`$${summary.totalCostUsd.toFixed(2)}`} />
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
      <div className="overflow-x-auto rounded-lg border border-[--border-default]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[--border-default] bg-[--bg-surface]">
              <th className="px-4 py-2 font-mono text-xs text-[--text-muted]">Date</th>
              <th className="px-4 py-2 font-mono text-xs text-[--text-muted]">Sessions</th>
              <th className="px-4 py-2 font-mono text-xs text-[--text-muted]">Tasks</th>
              <th className="px-4 py-2 font-mono text-xs text-[--text-muted]">Tokens</th>
              <th className="px-4 py-2 font-mono text-xs text-[--text-muted]">Cost</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((s) => (
              <tr
                key={s.id}
                className="border-b border-[--border-default] last:border-0 hover:bg-[--surface-hover]"
              >
                <td className="px-4 py-2.5 font-mono text-xs text-[--text-primary]">
                  {formatDate(s.date)}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-[--text-primary]">
                  {s.sessionsRun}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-[--text-primary]">
                  {s.tasksExecuted}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-[--text-primary]">
                  {formatTokens(s.promptTokens + s.completionTokens)}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-[--text-primary]">
                  ${s.estimatedCostUsd.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
