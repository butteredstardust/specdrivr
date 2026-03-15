'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { EventLog } from '@/components/mission-control/event-log';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Session {
  id: number;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  endedAt?: string | null;
  tasksExecuted: number;
  tasksSucceeded: number;
  tasksFailed: number;
  specId?: number | null;
  specTitle?: string;
}

const TERMINAL_STATUSES = ['completed', 'failed', 'cancelled'] as const;

function statusColor(status: Session['status']): string {
  switch (status) {
    case 'running':
      return 'text-green-400';
    case 'paused':
      return 'text-[--phosphor-amber]';
    case 'completed':
      return 'text-emerald-400';
    case 'failed':
      return 'text-red-400';
    case 'cancelled':
      return 'text-[--text-muted]';
    default:
      return 'text-[--text-muted]';
  }
}

function StatusDot({ status }: { status: Session['status'] }) {
  switch (status) {
    case 'running':
      return (
        <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-[--accent-violet]" />
      );
    case 'completed':
      return <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-400" />;
    case 'failed':
      return <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-red-400" />;
    case 'paused':
      return <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[--phosphor-amber]" />;
    case 'cancelled':
      return <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[--text-muted]" />;
    default:
      return null;
  }
}

function formatDuration(session: Session): string {
  const end = session.endedAt
    ? new Date(session.endedAt)
    : session.status === 'running'
      ? new Date()
      : null;
  if (!end) return '—';
  const ms = end.getTime() - new Date(session.startedAt).getTime();
  const secs = Math.floor(ms / 1000);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function formatStartedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function getGroupLabel(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (d.getTime() === today.getTime()) return 'TODAY';
  if (d.getTime() === yesterday.getTime()) return 'YESTERDAY';
  if (d >= weekStart) return 'THIS WEEK';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function SessionsPage() {
  const { activeProjectId } = useShell();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specFilter, setSpecFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Debounce search — state management only, not data fetching
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Single fetch for spec dropdown options
  const { data: specsData } = usePolling<Array<{ id: number; title: string }>>({
    url: activeProjectId ? `/api/v1/specs?projectId=${activeProjectId}` : null,
    interval: 60_000,
    stopWhen: () => true,
  });
  const specs = specsData ?? [];

  // Build poll URL from active filters
  const buildUrl = () => {
    if (!activeProjectId) return null;
    const params = new URLSearchParams({ projectId: String(activeProjectId) });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (specFilter !== 'all') params.set('specId', specFilter);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    return `/api/v1/sessions?${params}`;
  };
  const url = buildUrl();

  const { data: sessions, isLoading } = usePolling<Session[]>({
    url,
    interval: 5000,
    stopWhen: (data) =>
      Array.isArray(data) &&
      data.length > 0 &&
      data.every((s) => (TERMINAL_STATUSES as readonly string[]).includes(s.status)),
  });

  const handleRowClick = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const isEmpty = !isLoading && (!sessions || sessions.length === 0);

  const isAnyFilterActive =
    search !== '' ||
    statusFilter !== 'all' ||
    specFilter !== 'all' ||
    fromDate !== '' ||
    toDate !== '';

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setSpecFilter('all');
    setFromDate('');
    setToDate('');
  };

  // Group sessions by date label
  const groups = new Map<string, Session[]>();
  for (const session of sessions ?? []) {
    const label = getGroupLabel(session.startedAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(session);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">SESSIONS</h1>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="text"
          placeholder="Search sessions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-48 text-xs"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={specFilter} onValueChange={setSpecFilter}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="Spec" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All specs</SelectItem>
            {specs.map((spec) => (
              <SelectItem key={spec.id} value={String(spec.id)}>
                {spec.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="h-8 text-xs"
        />

        <Input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="h-8 text-xs"
        />

        {isAnyFilterActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-xs text-[--text-muted]"
          >
            Clear filters
          </Button>
        )}
      </div>

      {isLoading && !sessions && <p className="font-mono text-xs text-[--text-muted]">Loading…</p>}

      {isEmpty && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <DaemonMascot size={48} expression="idle" />
          <p className="font-mono text-xs text-[--text-muted]">No sessions yet.</p>
        </div>
      )}

      {!activeProjectId && !isLoading && (
        <p className="font-mono text-xs text-[--text-muted]">
          Select a project to view its sessions.
        </p>
      )}

      {sessions && sessions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[--border] text-left">
                <th className="pr-4 pb-2 font-mono font-normal tracking-widest text-[--text-muted] uppercase">
                  ID
                </th>
                <th className="pr-4 pb-2 font-mono font-normal tracking-widest text-[--text-muted] uppercase">
                  Status
                </th>
                <th className="pr-4 pb-2 font-mono font-normal tracking-widest text-[--text-muted] uppercase">
                  Spec
                </th>
                <th className="pr-4 pb-2 font-mono font-normal tracking-widest text-[--text-muted] uppercase">
                  Started
                </th>
                <th className="pr-4 pb-2 font-mono font-normal tracking-widest text-[--text-muted] uppercase">
                  Duration
                </th>
                <th className="pb-2 font-mono font-normal tracking-widest text-[--text-muted] uppercase">
                  Tasks
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from(groups.entries()).map(([label, groupSessions]) => (
                <Fragment key={`group-${label}`}>
                  <tr>
                    <td colSpan={6} className="px-0 py-0 pt-3 pb-1">
                      <span className="font-mono text-xs font-semibold tracking-widest text-[--text-muted] uppercase">
                        {label}
                      </span>
                    </td>
                  </tr>
                  {groupSessions.map((session) => (
                    <Fragment key={session.id}>
                      <tr
                        className="cursor-pointer border-b border-[--border] transition-colors hover:bg-[--surface-hover]"
                        onClick={() => handleRowClick(session.id)}
                      >
                        <td className="py-3 pr-4 font-mono text-[--text-primary]">
                          <Link
                            href={`/sessions/${session.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="rounded-sm bg-[--phosphor-amber]/10 px-1.5 py-0.5 font-mono text-xs text-[--phosphor-amber]">
                              #{session.id}
                            </span>
                          </Link>
                        </td>
                        <td
                          className={`py-3 pr-4 font-mono font-semibold ${statusColor(session.status)}`}
                        >
                          <StatusDot status={session.status} />
                          {session.status.toUpperCase()}
                        </td>
                        <td className="py-3 pr-4 font-mono text-[--text-secondary]">
                          {session.specTitle ?? (session.specId ? `Spec #${session.specId}` : '—')}
                        </td>
                        <td className="py-3 pr-4 font-mono text-[--text-secondary]">
                          {formatStartedAt(session.startedAt)}
                        </td>
                        <td className="py-3 pr-4 font-mono text-[--text-muted]">
                          {formatDuration(session)}
                        </td>
                        <td className="py-3 font-mono text-[--text-secondary]">
                          {session.tasksSucceeded}/{session.tasksExecuted}
                        </td>
                      </tr>
                      <tr key={`${session.id}-log`}>
                        <td colSpan={6} className="p-0">
                          <Collapsible open={expandedId === session.id}>
                            <CollapsibleContent>
                              <div className="border-b border-[--border] px-4 py-4">
                                <EventLog sessionId={session.id} />
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
