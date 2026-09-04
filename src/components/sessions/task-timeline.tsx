'use client';

import { useState, useEffect } from 'react';
import { useSSE } from '@/hooks/use-sse';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  SkipForward,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface TaskItem {
  id: number;
  externalId: string;
  title: string;
  description?: string | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  actualDurationMs: number | null;
  dependsOn: string[];
  orderIndex: number;
  blockedReason?: string | null;
  attemptCount?: number;
  verificationPassed?: boolean | null;
}

function statusColor(status: string): { bg: string; text: string; dot: string } {
  switch (status) {
    case 'in_progress':
      return {
        bg: 'bg-warning/10',
        text: 'text-warning',
        dot: 'bg-warning',
      };
    case 'done':
      return {
        bg: 'bg-success/10',
        text: 'text-success',
        dot: 'bg-success',
      };
    case 'blocked':
      return {
        bg: 'bg-danger/10',
        text: 'text-danger',
        dot: 'bg-danger',
      };
    case 'failed':
      return {
        bg: 'bg-danger/10',
        text: 'text-danger',
        dot: 'bg-danger',
      };
    case 'skipped':
      return {
        bg: 'bg-surface-inset',
        text: 'text-fg-muted',
        dot: 'bg-fg-muted',
      };
    default:
      return {
        bg: 'bg-surface-inset',
        text: 'text-fg-muted',
        dot: 'bg-fg-muted',
      };
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'done':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'blocked':
    case 'failed':
      return <AlertCircle className="h-4 w-4" />;
    case 'skipped':
      return <SkipForward className="h-4 w-4" />;
    case 'in_progress':
      return <Clock className="h-4 w-4 animate-spin" />;
    default:
      return <div className="h-4 w-4 rounded-full border border-current" />;
  }
}

function LiveDuration({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const ms = Date.now() - new Date(startedAt).getTime();
      const secs = Math.floor(ms / 1000);
      const mm = String(Math.floor(secs / 60)).padStart(2, '0');
      const ss = String(secs % 60).padStart(2, '0');
      setElapsed(`${mm}:${ss}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return <span className="text-fg-muted font-mono text-[10px]">{elapsed}</span>;
}

function taskDuration(task: TaskItem): React.ReactNode {
  if (task.status === 'in_progress' && task.startedAt) {
    return <LiveDuration startedAt={task.startedAt} />;
  }
  if (task.actualDurationMs != null) {
    const secs = Math.floor(task.actualDurationMs / 1000);
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    return (
      <span className="text-fg-muted font-mono text-[10px]">
        {mm}:{ss}
      </span>
    );
  }
  return <span className="text-fg-muted font-mono text-[10px]">—</span>;
}

interface TaskTimelineProps {
  sessionId: number;
}

export function TaskTimeline({ sessionId }: TaskTimelineProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  const { data, isLoading } = useSSE<TaskItem[]>({
    url: `/api/v1/sessions/${sessionId}/tasks`,
    sseUrl: `/api/v1/sessions/${sessionId}/stream`,
    enabled: true,
  });

  const tasks = data ? [...data].sort((a, b) => a.orderIndex - b.orderIndex) : [];

  const toggleTask = (id: number) => {
    setExpandedTaskId((prev) => (prev === id ? null : id));
  };

  return (
    <div>
      <p className="text-fg-muted mb-6 font-mono text-[10px] tracking-[0.2em] uppercase">
        Task Execution Timeline
      </p>
      {isLoading && tasks.length === 0 ? (
        <p className="text-fg-muted font-mono text-xs">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="text-fg-muted font-mono text-xs">No tasks found.</p>
      ) : (
        <div className="relative space-y-3">
          {tasks.map((task, idx) => {
            const colors = statusColor(task.status);
            const isLast = idx === tasks.length - 1;
            const isExpanded = expandedTaskId === task.id;

            return (
              <div key={task.id} className="relative flex gap-4">
                {/* Left column: dots and line */}
                <div className="relative flex flex-col items-center pt-1">
                  {/* Vertical line (extends down from dot) */}
                  {!isLast && (
                    <div
                      className={`bg-line/30 absolute top-6 left-1/2 w-0.5 -translate-x-1/2 ${isExpanded ? 'h-full' : 'h-12'}`}
                    />
                  )}

                  {/* Dot */}
                  <div
                    className={`relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${colors.dot} border-surface-base ${
                      task.status === 'in_progress'
                        ? 'ring-warning shadow-popover ring-2 ring-offset-2'
                        : ''
                    }`}
                  >
                    {task.status === 'in_progress' && (
                      <div className="bg-warning/30 absolute inset-0 animate-pulse rounded-full" />
                    )}
                  </div>
                </div>

                {/* Right column: content card */}
                <div className="flex-1 pt-0.5">
                  <div
                    onClick={() => toggleTask(task.id)}
                    className={`cursor-pointer rounded-lg border transition-all ${colors.bg} border-line/50 hover:border-line px-3 py-2.5`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-fg-muted shrink-0 font-mono text-[10px] font-semibold tracking-wider uppercase">
                            {task.externalId}
                          </span>
                          <div className={`flex items-center gap-1 ${colors.text}`}>
                            <StatusIcon status={task.status} />
                          </div>
                        </div>
                        <p className="text-fg truncate font-mono text-xs">{task.title}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {taskDuration(task)}
                        <span
                          className={`flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase ${colors.bg} ${colors.text}`}
                        >
                          {task.status.replace(/_/g, ' ')}
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div
                        className="border-line/50 mt-3 cursor-auto space-y-2 border-t pt-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {task.description && (
                          <div>
                            <span className="text-fg-muted mb-0.5 block font-mono text-[9px] tracking-wider uppercase">
                              Description
                            </span>
                            <p className="text-fg font-mono text-[10px] whitespace-pre-wrap">
                              {task.description}
                            </p>
                          </div>
                        )}
                        {task.blockedReason && (
                          <div>
                            <span className="text-danger mb-0.5 block font-mono text-[9px] tracking-wider uppercase">
                              Blocked Reason
                            </span>
                            <p className="text-danger font-mono text-[10px] whitespace-pre-wrap">
                              {task.blockedReason}
                            </p>
                          </div>
                        )}
                        <div className="mt-2 flex gap-4">
                          {task.attemptCount !== undefined && task.attemptCount > 0 && (
                            <div>
                              <span className="text-fg-muted mb-0.5 block font-mono text-[9px] tracking-wider uppercase">
                                Attempts
                              </span>
                              <p className="text-fg font-mono text-[10px]">{task.attemptCount}</p>
                            </div>
                          )}
                          {task.verificationPassed !== undefined &&
                            task.verificationPassed !== null && (
                              <div>
                                <span className="text-fg-muted mb-0.5 block font-mono text-[9px] tracking-wider uppercase">
                                  Verification
                                </span>
                                <p
                                  className={`font-mono text-[10px] ${task.verificationPassed ? 'text-success' : 'text-danger'}`}
                                >
                                  {task.verificationPassed ? 'Passed' : 'Failed'}
                                </p>
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
