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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Session {
  id: number;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  endedAt?: string | null;
  tasksExecuted: number;
  tasksSucceeded: number;
  tasksFailed: number;
  totalTasks?: number | null;
  specId?: number | null;
  specTitle?: string;
}

const TERMINAL_STATUSES = ['completed', 'failed', 'cancelled'] as const;

function SessionIdBadge({ id }: { id: number }) {
  return (
    <code className="bg-phosphor-amber/10 text-phosphor-amber inline-flex items-center rounded px-1.5 py-0.5 font-mono text-xs">
      SES-{String(id).padStart(3, '0')}
    </code>
  );
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusBadge({ status }: { status: Session['status'] }) {
  const base =
    'font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded inline-flex items-center gap-1.5';
  const dot = 'h-1.5 w-1.5 rounded-full shrink-0';
  switch (status) {
    case 'running':
      return (
        <span className={`${base} bg-accent-violet/10 text-accent-violet`}>
          <span className={`${dot} bg-accent-violet animate-pulse`} />
          Running
        </span>
      );
    case 'paused':
      return (
        <span className={`${base} bg-phosphor-amber/10 text-phosphor-amber`}>
          <span className={`${dot} bg-phosphor-amber`} />
          Paused
        </span>
      );
    case 'completed':
      return (
        <span className={`${base} bg-status-emerald/10 text-status-emerald`}>
          <span className={`${dot} bg-status-emerald`} />
          Done
        </span>
      );
    case 'failed':
      return (
        <span className={`${base} bg-status-red/10 text-status-red`}>
          <span className={`${dot} bg-status-red`} />
          Failed
        </span>
      );
    case 'cancelled':
      return (
        <span className={`${base} bg-secondary text-muted-foreground`}>
          <span className={`${dot} bg-muted-foreground`} />
          Cancelled
        </span>
      );
    default:
      return <span className={`${base} bg-secondary text-muted-foreground`}>{status}</span>;
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
  const [cancellingIds, setCancellingIds] = useState<Set<number>>(new Set());

  const handleCancel = async (e: React.MouseEvent, sessionId: number) => {
    e.stopPropagation();
    setCancellingIds((prev) => new Set(prev).add(sessionId));
    try {
      await fetch(`/api/v1/sessions/${sessionId}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      setCancellingIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  };

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specFilter, setSpecFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: specsData } = usePolling<Array<{ id: number; name: string }>>({
    url: activeProjectId ? `/api/v1/specs?projectId=${activeProjectId}` : null,
    interval: 60_000,
    stopWhen: () => true,
  });
  const specs = specsData ?? [];

  const buildUrl = () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (specFilter !== 'all') params.set('specId', specFilter);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    return `/api/v1/sessions?${params}`;
  };

  const { data: sessions, isLoading } = usePolling<Session[]>({
    url: buildUrl(),
    interval: 5000,
    stopWhen: (data) =>
      Array.isArray(data) &&
      data.length > 0 &&
      data.every((s) => (TERMINAL_STATUSES as readonly string[]).includes(s.status)),
  });

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

  const groups = new Map<string, Session[]>();
  for (const session of sessions ?? []) {
    const label = getGroupLabel(session.startedAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(session);
  }

  return (
    <div className="-mx-6 -mt-6 flex min-h-full flex-col">
      {/* Header */}
      <div className="border-border-default flex items-center justify-between border-b px-6 py-4">
        <div>
          <div className="text-muted-foreground mb-1 font-mono text-[10px] tracking-[0.2em] uppercase">
            Sessions
          </div>
          <h1 className="text-foreground text-xl font-semibold">Execution History</h1>
        </div>
      </div>

      {/* Filter bar — primary row */}
      <div className="border-border-default flex items-center gap-3 border-b px-6 py-3">
        <Input
          type="text"
          placeholder="Search sessions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-52 text-xs"
        />
        <div className="flex items-center gap-1">
          {(['all', 'running', 'completed', 'paused', 'failed', 'cancelled'] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => setStatusFilter(s)}
              className="h-7 px-2.5 font-mono text-[10px] tracking-wider uppercase"
            >
              {s === 'all' ? 'All' : s}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Select value={specFilter} onValueChange={setSpecFilter}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="All specs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All specs</SelectItem>
              {specs.map((spec) => (
                <SelectItem key={spec.id} value={String(spec.id)}>
                  {spec.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-8 w-36 text-xs"
          />
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-8 w-36 text-xs"
          />
          {isAnyFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground h-8 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="border-border-default border-b px-6 py-2.5">
        {!activeProjectId && !isLoading ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <DaemonMascot size={48} expression="idle" />
            <p className="text-muted-foreground font-mono text-sm">
              Select a project to view its sessions.
            </p>
          </div>
        ) : isLoading && !sessions ? (
          <div className="text-muted-foreground py-8 text-center font-mono text-xs">Loading…</div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <DaemonMascot size={48} expression="idle" />
            <p className="text-muted-foreground font-mono text-sm">No sessions yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border-default hover:bg-transparent">
                <TableHead className="text-muted-foreground h-auto w-36 px-6 py-2.5 font-mono text-[10px] font-medium tracking-[0.15em] uppercase">
                  ID
                </TableHead>
                <TableHead className="text-muted-foreground h-auto w-36 px-3 py-2.5 font-mono text-[10px] font-medium tracking-[0.15em] uppercase">
                  Status
                </TableHead>
                <TableHead className="text-muted-foreground h-auto px-3 py-2.5 font-mono text-[10px] font-medium tracking-[0.15em] uppercase">
                  Spec
                </TableHead>
                <TableHead className="text-muted-foreground h-auto w-40 px-3 py-2.5 font-mono text-[10px] font-medium tracking-[0.15em] uppercase">
                  Started
                </TableHead>
                <TableHead className="text-muted-foreground h-auto w-24 px-3 py-2.5 font-mono text-[10px] font-medium tracking-[0.15em] uppercase">
                  Duration
                </TableHead>
                <TableHead className="text-muted-foreground h-auto w-20 px-3 py-2.5 font-mono text-[10px] font-medium tracking-[0.15em] uppercase">
                  Tasks
                </TableHead>
                <TableHead className="h-auto w-24 px-3 py-2.5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(groups.entries()).map(([label, groupSessions]) => (
                <Fragment key={`group-${label}`}>
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableCell colSpan={7} className="px-6 pt-4 pb-1">
                      <span className="text-muted-foreground font-mono text-[10px] font-semibold tracking-[0.2em] uppercase">
                        {label}
                      </span>
                    </TableCell>
                  </TableRow>
                  {groupSessions.map((session) => (
                    <Fragment key={session.id}>
                      <TableRow
                        className="border-border-default/50 hover:bg-bg-elevated/50 cursor-pointer"
                        onClick={() =>
                          setExpandedId((prev) => (prev === session.id ? null : session.id))
                        }
                      >
                        <TableCell className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                          <Link href={`/sessions/${session.id}`}>
                            <SessionIdBadge id={session.id} />
                          </Link>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <StatusBadge status={session.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground px-3 py-3 font-mono text-xs">
                          {session.specTitle ?? (session.specId ? `Spec #${session.specId}` : '—')}
                        </TableCell>
                        <TableCell className="text-muted-foreground px-3 py-3 font-mono text-xs">
                          {timeAgo(session.startedAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground px-3 py-3 font-mono text-xs">
                          {formatDuration(session)}
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <span className="bg-secondary text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
                            {session.tasksSucceeded}/{session.totalTasks ?? session.tasksExecuted}{' '}
                            tasks
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          {session.status === 'running' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 font-mono text-[10px]"
                              disabled={cancellingIds.has(session.id)}
                              onClick={(e) => handleCancel(e, session.id)}
                            >
                              {cancellingIds.has(session.id) ? 'Cancelling…' : 'Cancel'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow
                        key={`${session.id}-log`}
                        className="border-0 p-0 hover:bg-transparent"
                      >
                        <TableCell colSpan={7} className="p-0">
                          <Collapsible open={expandedId === session.id}>
                            <CollapsibleContent>
                              <div className="border-border-default border-b px-6 py-4">
                                <EventLog sessionId={session.id} />
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
