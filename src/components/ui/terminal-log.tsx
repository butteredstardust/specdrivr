'use client';

import { useRef, useEffect } from 'react';
import AnsiToHtml from 'ansi-to-html';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';

const converter = new AnsiToHtml({ escapeXML: true });

interface TerminalLogProps {
  lines: string[];
  className?: string;
  maxHeight?: string;
  autoScroll?: boolean;
}

function getLineClass(line: string): string {
  if (line.includes('ERROR')) return 'text-status-red';
  if (line.includes('WARN')) return 'text-phosphor-amber';
  return 'text-text-secondary';
}

export function TerminalLog({
  lines,
  className,
  maxHeight = '400px',
  autoScroll = true,
}: TerminalLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledRef = useRef(false);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollTop >= el.scrollHeight - el.clientHeight - 20;
    isUserScrolledRef.current = !atBottom;
  };

  useEffect(() => {
    if (!autoScroll || isUserScrolledRef.current) return;
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, autoScroll]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn('terminal-surface bg-terminal-bg overflow-y-auto rounded-md p-3', className)}
      style={{ maxHeight }}
    >
      <div className="space-y-0.5 font-mono text-xs leading-relaxed">
        {lines.map((line, i) => (
          <div
            key={i}
            className={getLineClass(line)}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(converter.toHtml(line)) }}
          />
        ))}
      </div>
    </div>
  );
}
