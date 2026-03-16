'use client';

import { useState, useCallback, Fragment } from 'react';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { PixelBadge } from '@/components/ui/pixel-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { EventLog } from '@/components/mission-control/event-log';
import { Search, Loader2, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import type { SessionStatus } from '@/db/schema';

interface Session {
  id: number;
  specId: number;
  status: SessionStatus;
  startedAt: string;
  endedAt?: string | null;
  tasksExecuted: number;
  tasksSucceeded: number;
  tasksFailed: number;
  totalTasks?: number | null;
  specTitle?: string;
}

const TERMINAL_STATUSES: readonly string[] = ['completed', 'failed', 'cancelled'];

function StatusBadge({ status }: { status: SessionStatus }) {
  switch (status) {
    case 'running':
      return (
        <PixelBadge variant="violet" dot>
          Running
        </PixelBadge>
      );
    case 'completed':
      return <PixelBadge variant="emerald">Done</PixelBadge>;
    case 'paused':
      return <PixelBadge variant="amber">Paused</PixelBadge>;
    case 'failed':
      return <PixelBadge variant="red">Failed</PixelBadge>;
    case 'cancelled':
      return <PixelBadge variant="muted">Stopped</PixelBadge>;
    default:
      return <PixelBadge>{status}</PixelBadge>;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { activeProjectId } = useShell();

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [cancellingIds, setCancellingIds] = useState<Set<number>>(new Set());

  const search = searchParams.get('search') ?? '';
  const statusFilter = searchParams.get('status') ?? 'all';
  const specFilter = searchParams.get('specId') ?? 'all';
  const fromDate = searchParams.get('from') ?? '';
  const toDate = searchParams.get('to') ?? '';

  const updateFilters = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === 'all' || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const buildFetchUrl = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeProjectId) params.set('projectId', String(activeProjectId));
    return `/api/v1/sessions?${params.toString()}`;
  };

  const sessionsUrl = buildFetchUrl();

  const { data: sessions, isLoading } = usePolling<Session[]>({
    url: sessionsUrl,
    interval: 3000,
    stopWhen: (data) =>
      Array.isArray(data) &&
      data.length > 0 &&
      data.every((s) => TERMINAL_STATUSES.includes(s.status)),
  });

  const { data: specsData } = usePolling<Array<{ id: number; name: string }>>({
    url: activeProjectId ? `/api/v1/specs?projectId=${activeProjectId}` : null,
    interval: 60000,
  });
  const specs = specsData ?? [];

  const handleCancel = async (sessionId: number) => {
    setCancellingIds((prev) => new Set(prev).add(sessionId));
    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}/cancel`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to cancel session');
    } catch (error) {
      console.error('Cancel failed:', error);
    } finally {
      setCancellingIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  };

  const isAnyFilterActive =
    search !== '' ||
    statusFilter !== 'all' ||
    specFilter !== 'all' ||
    fromDate !== '' ||
    toDate !== '';

  const clearFilters = () => {
    router.push(pathname);
  };

  const groups = new Map<string, Session[]>();
  for (const session of sessions ?? []) {
    const label = getGroupLabel(session.startedAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(session);
  }

  return (
    <div className="-mx-6 -mt-6 flex min-h-full flex-col">
      <PageHeader category="Executor" title="Sessions" />

      {/* Filter Bar */}
      <div className="border-border-default flex items-center gap-3 border-b px-6 py-2.5">
        <div className="relative w-52">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            placeholder="Search sessions..."
            className="h-8 pl-8 font-mono text-[10px] tracking-wider uppercase"
            value={search}
            onChange={(e) => updateFilters({ search: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-1">
          {(['all', 'running', 'completed', 'paused', 'failed', 'cancelled'] as const).map((s) => {
            const isActive = statusFilter === s;
            return (
              <Button
                key={s}
                variant={isActive ? 'default' : 'secondary'}
                size="sm"
                onClick={() => updateFilters({ status: s })}
                className={cn(
                  'h-7 px-2.5 font-mono text-[10px] tracking-wider uppercase transition-all',
                  !isActive && 'bg-secondary/50 text-muted-foreground hover:text-foreground'
                )}
              >
                {s}
              </Button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Select value={specFilter} onValueChange={(val) => updateFilters({ specId: val })}>
            <SelectTrigger className="h-8 w-40 font-mono text-[10px] tracking-wider uppercase">
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
            onChange={(e) => updateFilters({ from: e.target.value })}
            className="h-8 w-36 font-mono text-[10px]"
          />
          <Input
            type="date"
            value={toDate}
            onChange={(e) => updateFilters({ to: e.target.value })}
            className="h-8 w-36 font-mono text-[10px]"
          />
          {isAnyFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground h-8 font-mono text-[10px] tracking-wider uppercase"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {!activeProjectId && !isLoading ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <DaemonMascot size={48} expression="idle" />
            <p className="text-muted-foreground font-mono text-sm">
              Select a project to view sessions.
            </p>
          </div>
        ) : isLoading && !sessions ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <DaemonMascot size={48} expression="idle" />
            <p className="text-muted-foreground font-mono text-sm">No sessions found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border-default text-muted-foreground font-mono text-[10px] tracking-[0.15em] uppercase hover:bg-transparent">
                <TableHead className="w-36 px-6 font-medium">Session ID</TableHead>
                <TableHead className="w-36 px-3 font-medium">Status</TableHead>
                <TableHead className="px-3 font-medium">Spec</TableHead>
                <TableHead className="w-40 px-3 font-medium">Started</TableHead>
                <TableHead className="w-24 px-3 font-medium">Duration</TableHead>
                <TableHead className="w-24 px-3 font-medium">Tasks</TableHead>
                <TableHead className="w-24 px-3" />
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
                            <PixelBadge variant="amber">
                              SESS-{String(session.id).padStart(3, '0')}
                            </PixelBadge>
                          </Link>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <StatusBadge status={session.status} />
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <div className="flex flex-col">
                            <span className="text-foreground text-sm font-medium">
                              {session.specTitle || `Spec #${session.specId}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground px-3 py-3 font-mono text-[10px] uppercase">
                          {new Date(session.startedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell className="text-muted-foreground px-3 py-3 font-mono text-[10px]">
                          {formatDuration(session)}
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <span className="bg-secondary text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap">
                            {session.tasksSucceeded}/{session.totalTasks ?? session.tasksExecuted}{' '}
                            tasks
                          </span>
                        </TableCell>
                        <TableCell
                          className="px-3 py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-2">
                            {session.status === 'running' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={cancellingIds.has(session.id)}
                                onClick={() => handleCancel(session.id)}
                                className="h-6 px-2 font-mono text-[10px] tracking-wider uppercase transition-colors"
                              >
                                {cancellingIds.has(session.id) ? 'Stopping…' : 'Stop'}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground h-6 w-6"
                              asChild
                            >
                              <Link href={`/sessions/${session.id}`}>
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow className="border-0 p-0 hover:bg-transparent">
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
