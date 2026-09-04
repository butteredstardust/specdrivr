'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
import { Button } from '@/components/ui/button';
import {
  FilterToolbar,
  FilterToolbarActions,
  FilterSearch,
  FilterTextInput,
  FilterSelect,
  FilterDateRange,
  FilterClearButton,
} from '@/components/ui/filter-toolbar';
import { StatusIcon } from '@/components/ui/status-icon';
import { Loader2, ChevronLeft, ChevronRight, ChevronDown, Download, Activity } from 'lucide-react';
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

/** Sentinel for "no action filter": Radix Select rejects an empty item value. */
const ALL_ACTIONS = '__all__';

const ACTION_OPTIONS = [
  { value: ALL_ACTIONS, label: 'All actions' },
  { value: 'project.updated', label: 'project.updated' },
  { value: 'member.invited', label: 'member.invited' },
  { value: 'member.removed', label: 'member.removed' },
  { value: 'spec.created', label: 'spec.created' },
  { value: 'plan.approved', label: 'plan.approved' },
  { value: 'session.started', label: 'session.started' },
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
      <tr className="border-line-subtle hover:bg-surface-inset border-b last:border-0">
        <td className="text-fg-muted px-4 py-2.5 font-mono text-xs">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="text-fg-muted hover:text-fg h-auto gap-1.5 px-0 font-mono text-xs"
          >
            <ChevronDown
              className={`size-3 shrink-0 transition-transform ${expanded ? 'rotate-0' : '-rotate-90'}`}
            />
            {entry.userId ?? '—'}
          </Button>
        </td>
        <td className="text-fg px-4 py-2.5 font-mono text-xs">{entry.action}</td>
        <td className="text-fg-muted px-4 py-2.5 font-mono text-xs">{entry.targetType ?? '—'}</td>
        <td className="text-fg-muted px-4 py-2.5 font-mono text-xs">{entry.targetId ?? '—'}</td>
        <td className="text-fg-muted px-4 py-2.5 font-mono text-xs">{entry.ipAddress ?? '—'}</td>
        <td className="text-fg-muted px-4 py-2.5 font-mono text-xs">{formatTs(entry.createdAt)}</td>
      </tr>

      {expanded && (
        <tr className="border-line border-b">
          <td colSpan={6} className="px-4 pt-0 pb-3">
            <pre className="border-line bg-log-bg text-log-text max-h-64 overflow-auto rounded-md border p-3 font-mono text-xs">
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
  const [actorInput, setActorInput] = useState('');
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const buildUrl = () => {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (actor) params.set('actor', actor);
    // `action` never holds the sentinel — `handleActionChange` maps it to `''`.
    if (action) params.set('action', action);
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

  const handleActorCommit = (value: string) => {
    if (value === actor) return;
    setActor(value);
    setPage(1);
    restart();
  };

  const handleActionChange = (value: string) => {
    setAction(value === ALL_ACTIONS ? '' : value);
    setPage(1);
    restart();
  };

  const handleFromChange = (value: string) => {
    setFromDate(value);
    setPage(1);
    restart();
  };

  const handleToChange = (value: string) => {
    setToDate(value);
    setPage(1);
    restart();
  };

  const isAnyFilterActive =
    search !== '' || actor !== '' || action !== '' || fromDate !== '' || toDate !== '';

  const clearFilters = () => {
    // A search typed within the last 300ms still has a pending commit; without
    // this the field clears and then silently re-filters on that stale term.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearchInput('');
    setSearch('');
    setActorInput('');
    setActor('');
    setAction('');
    setFromDate('');
    setToDate('');
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
    <section className="border-line bg-surface-raised flex flex-col gap-4 rounded-lg border p-4">
      <FilterToolbar variant="inline">
        <FilterSearch
          value={searchInput}
          onValueChange={handleSearchInput}
          placeholder="Search actions…"
          label="Search audit actions"
        />
        <FilterTextInput
          value={actorInput}
          onValueChange={setActorInput}
          onCommit={handleActorCommit}
          placeholder="Actor user ID"
          label="Filter by actor user ID"
        />
        <FilterSelect
          value={action || ALL_ACTIONS}
          onValueChange={handleActionChange}
          options={ACTION_OPTIONS}
          label="Filter by action"
          icon={Activity}
        />
        <FilterDateRange
          from={fromDate}
          to={toDate}
          onFromChange={handleFromChange}
          onToChange={handleToChange}
          label="Logged between"
        />

        <FilterToolbarActions>
          {isAnyFilterActive && <FilterClearButton onClear={clearFilters} />}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={entries.length === 0}
            className="h-8 gap-2 text-xs"
          >
            <Download className="size-3" />
            Export CSV
          </Button>
        </FilterToolbarActions>
      </FilterToolbar>

      {isLoading && (
        <div className="text-fg-muted flex items-center gap-2">
          <Loader2 className="size-3 animate-spin" />
          <span className="text-xs">Loading audit log…</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="flex items-center gap-2">
          <span className="text-danger text-xs">Failed to load audit log.</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={restart}
            className="text-fg-muted hover:text-fg h-auto px-0 text-xs underline hover:bg-transparent"
          >
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <StatusIcon size={24} status="idle" />
          <p className="text-fg text-lg font-semibold">No audit entries</p>
          <p className="text-fg-muted text-sm">Administrative actions will be logged here.</p>
        </div>
      )}

      {!isLoading && !error && entries.length > 0 && (
        <>
          <div className="border-line overflow-x-auto rounded-lg border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-line bg-surface-sunken border-b">
                  <th className="text-fg-muted px-4 py-2 text-xs font-medium">Actor</th>
                  <th className="text-fg-muted px-4 py-2 text-xs font-medium">Action</th>
                  <th className="text-fg-muted px-4 py-2 text-xs font-medium">Resource</th>
                  <th className="text-fg-muted px-4 py-2 text-xs font-medium">Resource ID</th>
                  <th className="text-fg-muted px-4 py-2 text-xs font-medium">IP</th>
                  <th className="text-fg-muted px-4 py-2 text-xs font-medium">Timestamp</th>
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
              <span className="text-fg-muted text-xs tabular-nums">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="gap-1 text-xs"
                >
                  <ChevronLeft className="size-3" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="gap-1 text-xs"
                >
                  Next
                  <ChevronRight className="size-3" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
