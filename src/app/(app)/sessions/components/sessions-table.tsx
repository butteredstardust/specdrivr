'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  Loader2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { clientLogger } from '@/lib/logger-client';
import { Session } from '../types';

import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import { PixelBadge } from '@/components/ui/pixel-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { EventLog } from '@/components/mission-control/event-log';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SessionsTableProps {
  sessions: Session[] | null;
  isLoading: boolean;
  error: Error | null;
  activeProjectId: number | null;
}

function StatusBadge({ status }: { status: Session['status'] }) {
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
      return <PixelBadge variant="muted">Cancelled</PixelBadge>;
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

// Subcomponent for lazy loading EventLog
function LazyEventLog({ sessionId, isExpanded }: { sessionId: number; isExpanded: boolean }) {
  if (!isExpanded) return null;
  return <EventLog sessionId={sessionId} />;
}

export function SessionsTable({ sessions, isLoading, error, activeProjectId }: SessionsTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [cancellingIds, setCancellingIds] = useState<Set<number>>(new Set());

  // Memoized Grouping
  const groupedSessions = useMemo(() => {
    const groups = new Map<string, Session[]>();
    for (const session of sessions ?? []) {
      const label = getGroupLabel(session.startedAt);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(session);
    }
    return Array.from(groups.entries());
  }, [sessions]);

  const handleCancel = async (sessionId: number) => {
    setCancellingIds((prev) => new Set(prev).add(sessionId));
    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}/cancel`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to cancel session');
    } catch (error) {
      clientLogger.error('Cancel failed', { error });
    } finally {
      setCancellingIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  };

  const toggleExpand = (sessionId: number) => {
    setExpandedId((prev) => (prev === sessionId ? null : sessionId));
  };

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load sessions. Please try refreshing the page.
            <br />
            <span className="mt-2 block font-mono text-xs opacity-70">{error.message}</span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!activeProjectId && !isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <DaemonMascot size={48} expression="idle" />
        <p className="text-muted-foreground font-mono text-sm">
          Select a project to view sessions.
        </p>
      </div>
    );
  }

  if (isLoading && !sessions) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <DaemonMascot size={48} expression="idle" />
        <p className="text-muted-foreground font-mono text-sm">
          No sessions found matching your filters.
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/plans">Create Session</Link>
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border-default text-muted-foreground font-mono text-[10px] tracking-[0.15em] uppercase hover:bg-transparent">
          <TableHead className="w-10 px-3"></TableHead>
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
        {groupedSessions.map(([label, groupSessions]) => (
          <React.Fragment key={`group-${label}`}>
            <TableRow className="border-0 hover:bg-transparent">
              <TableCell colSpan={8} className="px-6 pt-4 pb-1">
                <span className="text-muted-foreground font-mono text-[10px] font-semibold tracking-[0.2em] uppercase">
                  {label}
                </span>
              </TableCell>
            </TableRow>
            {groupSessions.map((session) => {
              const isExpanded = expandedId === session.id;
              return (
                <React.Fragment key={session.id}>
                  <TableRow className="border-border-default/50 hover:bg-bg-elevated/50 group">
                    <TableCell className="px-3 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground h-6 w-6"
                        onClick={() => toggleExpand(session.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="px-6 py-3">
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
                        {session.tasksSucceeded}/{session.totalTasks ?? session.tasksExecuted} tasks
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {session.status === 'running' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={cancellingIds.has(session.id)}
                            onClick={() => handleCancel(session.id)}
                            className="h-6 px-2 font-mono text-[10px] tracking-wider uppercase transition-colors"
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            {cancellingIds.has(session.id) ? 'Cancelling…' : 'Cancel'}
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
                    <TableCell colSpan={8} className="p-0">
                      <Collapsible open={isExpanded}>
                        <CollapsibleContent>
                          <div className="border-border-default border-b px-6 py-4">
                            <LazyEventLog sessionId={session.id} isExpanded={isExpanded} />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
