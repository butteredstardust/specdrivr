'use client';

import { useState, useCallback, useRef } from 'react';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Loader2, ChevronLeft, ChevronRight, ChevronDown, Download } from 'lucide-react';
import type { AuditLogSelect } from '@/db/schema';

interface AuditMeta {
  page: number;
  total: number;
  pageSize: number;
}

type AuditEntryRow = AuditLogSelect;

interface AuditPayload {
  items: AuditEntryRow[];
  meta: AuditMeta;
}

interface AuditLogSectionProps {
  projectId: number;
}

const KNOWN_ACTIONS = [
  'project.updated',
  'member.invited',
  'member.removed',
  'spec.created',
  'plan.approved',
  'session.started',
];

function formatTs(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function AuditRow({ entry }: { entry: AuditLogSelect }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-border-default hover:bg-bg-elevated/50 cursor-pointer border-b last:border-0"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="text-text-muted px-4 py-2.5 font-mono text-xs">
          <span className="flex items-center gap-1.5">
            <ChevronDown
              className={`size-3 shrink-0 transition-transform ${expanded ? 'rotate-0' : '-rotate-90'}`}
            />
            {entry.userId ?? '—'}
          </span>
        </td>
        <td className="text-text-primary px-4 py-2.5 font-mono text-xs">{entry.action}</td>
        <td className="text-text-muted px-4 py-2.5 font-mono text-xs">{entry.targetType ?? '—'}</td>
        <td className="text-text-muted px-4 py-2.5 font-mono text-xs">{entry.targetId ?? '—'}</td>
        <td className="text-text-muted px-4 py-2.5 font-mono text-xs">{entry.ipAddress ?? '—'}</td>
        <td className="text-text-muted px-4 py-2.5 font-mono text-xs">
          {formatTs(entry.createdAt)}
        </td>
      </tr>

      {expanded && (
        <tr className="border-border-default border-b">
          <td colSpan={6} className="px-4 pt-0 pb-3">
            <pre className="bg-bg-base text-text-primary max-h-64 overflow-auto rounded-md p-3 font-mono text-xs">
              {entry.detail ? JSON.stringify(entry.detail, null, 2) : '(no detail)'}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

export function AuditLogSection({ projectId }: AuditLogSectionProps) {
  const [page, setPage] = useState(1);
  const [reqKey, setReqKey] = useState(0);
  const [entries, setEntries] = useState<AuditEntryRow[]>([]);
  const [meta, setMeta] = useState<AuditMeta | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = () => {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (actor) params.set('actor', actor);
    if (action && action !== '__all__') params.set('action', action);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    params.set('_t', String(reqKey));
    return `/api/v1/projects/${projectId}/audit?${params.toString()}`;
  };

  const url = buildUrl();

  const stopWhen = useCallback((data: AuditPayload) => {
    setEntries(data.items);
    setMeta(data.meta);
    return true;
  }, []);

  const onError = useCallback((err: Error) => {
    clientLogger.error('Failed to load audit log', err);
  }, []);

  const { isLoading, error, restart } = usePolling<AuditPayload>({
    url,
    stopWhen,
    onError,
  });

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.pageSize)) : 1;

  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
      setReqKey((k) => k + 1);
      restart();
    }, 300);
  };

  const goToPage = (next: number) => {
    setPage(next);
    setReqKey((k) => k + 1);
    restart();
  };

  const handleActorBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value !== actor) {
      setActor(e.target.value);
      setPage(1);
      restart();
    }
  };

  const handleActionChange = (value: string) => {
    setAction(value);
    setPage(1);
    restart();
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromDate(e.target.value);
    setPage(1);
    restart();
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToDate(e.target.value);
    setPage(1);
    restart();
  };

  const handleExport = () => {
    const header = 'Actor,Action,Resource,Resource ID,IP,Timestamp\n';
    const rows = entries
      .map(
        (e) =>
          `${e.userId ?? ''},${e.action},${e.targetType ?? ''},${e.targetId ?? ''},${e.ipAddress ?? ''},${formatTs(e.createdAt)}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `audit-${projectId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search actions…"
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          className="h-8 w-48 font-mono text-xs"
        />
        <Input
          placeholder="Actor user ID"
          defaultValue={actor}
          onBlur={handleActorBlur}
          className="h-8 w-48 font-mono text-xs"
        />
        <Select value={action || '__all__'} onValueChange={handleActionChange}>
          <SelectTrigger className="h-8 w-44 font-mono text-xs">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__" className="font-mono text-xs">
              All actions
            </SelectItem>
            {KNOWN_ACTIONS.map((a) => (
              <SelectItem key={a} value={a} className="font-mono text-xs">
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={fromDate}
          onChange={handleFromChange}
          className="h-8 w-36 font-mono text-xs"
          aria-label="From date"
        />
        <Input
          type="date"
          value={toDate}
          onChange={handleToChange}
          className="h-8 w-36 font-mono text-xs"
          aria-label="To date"
        />

        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={entries.length === 0}
            className="gap-2 font-mono text-xs"
          >
            <Download className="size-3" />
            Export CSV
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="text-text-muted flex items-center gap-2">
          <Loader2 className="size-3 animate-spin" />
          <span className="font-mono text-xs">Loading audit log…</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="flex items-center gap-2">
          <span className="text-status-red font-mono text-xs">Failed to load audit log.</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={restart}
            className="text-text-muted hover:text-text-primary h-auto px-0 font-mono text-xs underline hover:bg-transparent"
          >
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <DaemonMascot size={32} expression="idle" />
          <p className="text-text-muted font-mono text-sm">No audit entries.</p>
          <p className="text-text-muted font-mono text-xs">
            Administrative actions will be logged here.
          </p>
        </div>
      )}

      {!isLoading && !error && entries.length > 0 && (
        <>
          <div className="border-border-default overflow-x-auto rounded-lg border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-border-default bg-bg-surface border-b">
                  <th className="text-text-muted px-4 py-2 font-mono text-xs">Actor</th>
                  <th className="text-text-muted px-4 py-2 font-mono text-xs">Action</th>
                  <th className="text-text-muted px-4 py-2 font-mono text-xs">Resource</th>
                  <th className="text-text-muted px-4 py-2 font-mono text-xs">Resource ID</th>
                  <th className="text-text-muted px-4 py-2 font-mono text-xs">IP</th>
                  <th className="text-text-muted px-4 py-2 font-mono text-xs">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <AuditRow key={entry.id} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.total > meta.pageSize && (
            <div className="flex items-center justify-between">
              <span className="text-text-muted font-mono text-xs">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="gap-1 font-mono text-xs"
                >
                  <ChevronLeft className="size-3" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="gap-1 font-mono text-xs"
                >
                  Next
                  <ChevronRight className="size-3" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
