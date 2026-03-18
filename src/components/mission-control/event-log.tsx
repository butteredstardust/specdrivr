'use client';

import { useState, useEffect } from 'react';
import { TerminalLog } from '@/components/ui/terminal-log';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EventLogProps {
  sessionId: number | null;
  className?: string;
}

export function EventLog({ sessionId, className }: EventLogProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId === null) return;

    setLogs([]);
    setError(null);
    setIsConnected(false);

    const es = new EventSource(`/api/v1/sessions/${sessionId}/stream`);

    es.onopen = () => {
      setIsConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected' || data.type === 'history_end') {
          return;
        }
        if (data.line !== undefined) {
          const date = new Date(data.ts || Date.now());
          const timeStr = date.toLocaleTimeString('en-US', { hour12: false });
          let formattedLine = `[${timeStr}] ${data.line}`;

          if (data.level === 'error') {
            formattedLine = `ERROR: ${formattedLine}`;
          } else if (data.level === 'warn') {
            formattedLine = `WARN: ${formattedLine}`;
          }

          setLogs((prev) => [...prev, formattedLine]);
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = (err) => {
      console.error('SSE Error:', err);
      setError('Connection lost. Reconnecting...');
      setIsConnected(false);
    };

    return () => {
      es.close();
    };
  }, [sessionId]);

  const filteredLogs = showErrorsOnly ? logs.filter((l) => l.includes('ERROR:')) : logs;

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-muted-foreground font-mono text-[10px] tracking-[0.15em] uppercase">
          Session Log
        </p>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 px-2 font-mono text-[10px] ${showErrorsOnly ? 'bg-bg-elevated' : ''}`}
          onClick={() => setShowErrorsOnly(!showErrorsOnly)}
        >
          <Filter className="mr-1 h-3 w-3" />
          {showErrorsOnly ? 'Errors Only' : 'All Logs'}
        </Button>
      </div>

      <div className="bg-bg-elevated border-border-default relative flex min-h-0 flex-1 flex-col overflow-hidden rounded border">
        {error && (
          <div className="bg-status-red/10 text-status-red border-status-red/20 absolute top-0 right-0 left-0 z-10 border-b px-3 py-1 font-mono text-[10px]">
            {error}
          </div>
        )}
        {!isConnected && logs.length === 0 && !error ? (
          <p className="text-muted-foreground px-3 py-2 font-mono text-xs">Connecting to stream…</p>
        ) : sessionId === null ? (
          <p className="text-muted-foreground px-3 py-2 font-mono text-xs">No active session.</p>
        ) : (
          <TerminalLog
            lines={filteredLogs}
            className="h-full max-h-none flex-1 rounded-none border-0"
            autoScroll={true}
          />
        )}
      </div>
    </div>
  );
}
