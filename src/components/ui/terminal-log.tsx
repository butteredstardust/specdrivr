'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import AnsiToHtml from 'ansi-to-html';
import { twMerge } from 'tailwind-merge';

export type LogLine = {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string; // may contain ANSI escape codes
  timestamp: string; // ISO8601
  isInternal?: boolean; // if true, render dimmer (dev mode only)
};

export type TerminalLogProps = {
  lines: LogLine[];
  height?: number | string; // default: 200
  autoScroll?: boolean; // default: true
  className?: string;
};

const levelColorMap = {
  error: 'var(--status-red)',
  warn: 'var(--phosphor-amber)',
  info: 'var(--text-primary)',
  debug: 'var(--text-muted)',
};

export function TerminalLog({
  lines,
  height = 200,
  autoScroll = true,
  className,
}: TerminalLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolled, setIsUserScrolled] = useState(false);

  const converter = useMemo(
    () =>
      new AnsiToHtml({
        fg: '#f4f4f5',
        bg: '#0d0d0a',
        escapeXML: true,
      }),
    []
  );

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

    // If user scrolls up by more than 20px from bottom, pause auto-scroll
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 20;
    setIsUserScrolled(!isAtBottom);
  };

  useEffect(() => {
    if (autoScroll && !isUserScrolled && containerRef.current) {
      const container = containerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [lines, autoScroll, isUserScrolled]);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', { hour12: false }); // HH:MM:SS
    } catch {
      return '00:00:00';
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height }}
      className={twMerge(
        'terminal-surface relative overflow-y-auto rounded-md bg-[--terminal-bg] p-2 font-mono text-[13px]',
        className
      )}
    >
      {lines.length === 0 ? (
        <div className="text-[--text-muted] italic">Waiting for logs...</div>
      ) : (
        <div className="relative z-10 flex flex-col gap-0.5">
          {lines.map((line) => {
            const htmlMessage = converter.toHtml(line.message);
            const time = formatTime(line.timestamp);

            return (
              <div
                key={line.id}
                className="flex items-start break-words"
                style={{
                  color: levelColorMap[line.level],
                  opacity: line.isInternal ? 0.6 : 1,
                }}
              >
                <span className="mr-3 shrink-0 text-[--text-muted] select-none">{time}</span>
                <span
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: htmlMessage }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
