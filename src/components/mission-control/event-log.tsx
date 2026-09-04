'use client';

import { useState, useEffect } from 'react';
import { TerminalLog } from '@/components/ui/terminal-log';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EventLogProps {
  sessionId: number | null;
  onUpdate?: () => void;
  className?: string;
}

interface LogEntry {
  id: string;
  line: string;
  level: string;
  timestamp: string;
  type?: 'log' | 'event';
}

export function EventLog({ sessionId, onUpdate, className }: EventLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId === null) return;

    setLogs([]);
    setError(null);
    setIsConnected(false);

    const es = new EventSource(`/api/v1/sessions/${sessionId}/stream`, {
      withCredentials: true,
    });

    const formatTimestamp = (ts?: number | string | Date) => {
      const date = new Date(ts || Date.now());
      return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    };

    const handleLog = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.line !== undefined) {
          const timeStr = formatTimestamp(data.ts);
          const formattedLine = `[${timeStr}] ${data.line}`;

          const entry: LogEntry = {
            id: data.id || `log-${Date.now()}-${Math.random()}`,
            line: formattedLine,
            level: data.level || 'info',
            timestamp: timeStr,
            type: 'log',
          };

          if (data.level === 'error') {
            entry.line = `ERROR: ${entry.line}`;
          } else if (data.level === 'warn') {
            entry.line = `WARN: ${entry.line}`;
          }

          setLogs((prev) => {
            if (prev.some((p) => p.id === entry.id)) return prev;
            return [...prev, entry];
          });
        }
      } catch (err) {
        console.error('Failed to parse log event:', err);
      }
    };

    const handleEvent = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const timeStr = formatTimestamp(data.createdAt);

        const entry: LogEntry = {
          id: `event-${data.id || Date.now()}-${Math.random()}`,
          line: `[${timeStr}] ✨ EVENT: ${data.message}`,
          level: 'info',
          timestamp: timeStr,
          type: 'event',
        };

        setLogs((prev) => [...prev, entry]);
        onUpdate?.(); // Events often mean state changed
      } catch (err) {
        console.error('Failed to parse agent event:', err);
      }
    };

    const handleUpdate = () => {
      onUpdate?.();
    };

    const handleConnected = () => {
      setIsConnected(true);
      setError(null);
    };

    es.addEventListener('log', handleLog as (event: Event) => void);
    es.addEventListener('event', handleEvent as (event: Event) => void);
    es.addEventListener('update', handleUpdate as (event: Event) => void);
    es.addEventListener('connected', handleConnected as (event: Event) => void);
    es.addEventListener('history_end', (() => {
      // Optional: mark history as finished
    }) as (event: Event) => void);

    es.onopen = () => {
      setIsConnected(true);
    };

    es.onerror = (err) => {
      console.error('SSE Error:', err);
      setError('Connection lost. Reconnecting...');
      setIsConnected(false);
    };

    return () => {
      es.removeEventListener('log', handleLog as (event: Event) => void);
      es.removeEventListener('event', handleEvent as (event: Event) => void);
      es.removeEventListener('update', handleUpdate as (event: Event) => void);
      es.removeEventListener('connected', handleConnected as (event: Event) => void);
      es.close();
    };
  }, [sessionId, onUpdate]);

  const filteredLogs = showErrorsOnly ? logs.filter((l) => l.level === 'error') : logs;
  const logLines = filteredLogs.map((l) => l.line);

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-fg-muted text-2xs">Session Log</p>
        <Button
          variant="ghost"
          size="sm"
          className={`text-2xs h-6 px-2 ${showErrorsOnly ? 'bg-surface-inset' : ''}`}
          onClick={() => setShowErrorsOnly(!showErrorsOnly)}
        >
          <Filter className="mr-1 h-3 w-3" />
          {showErrorsOnly ? 'Errors Only' : 'All Logs'}
        </Button>
      </div>

      <div className="bg-surface-inset border-line relative flex min-h-0 flex-1 flex-col overflow-hidden rounded border">
        {error && (
          <div className="bg-danger-bg text-danger border-danger-border text-2xs absolute top-0 right-0 left-0 z-10 border-b px-3 py-1 font-mono">
            {error}
          </div>
        )}
        {!isConnected && logs.length === 0 && !error ? (
          <p className="text-fg-muted px-3 py-2 text-xs">Connecting to stream…</p>
        ) : sessionId === null ? (
          <p className="text-fg-muted px-3 py-2 text-xs">No active session.</p>
        ) : (
          <TerminalLog
            lines={logLines}
            className="h-full max-h-none flex-1 rounded-none border-0"
            autoScroll={true}
          />
        )}
      </div>
    </div>
  );
}
