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
  if (line.includes('ERROR')) return 'text-danger';
  if (line.includes('WARN')) return 'text-warning';
  return 'text-log-text';
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
      role="log"
      aria-live="polite"
      aria-label="Log output"
      className={cn('border-line bg-log-bg overflow-y-auto rounded-md border p-4', className)}
      style={{ maxHeight }}
    >
      <div className="space-y-0.5 font-mono text-xs leading-relaxed">
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              getLineClass(line),
              'hover:bg-fg/5 -mx-1 rounded-sm px-1 transition-colors duration-[120ms]'
            )}
            // We use sanitizeHtml here to ensure the content is safe before rendering.
            // This is a deliberate bypass of the static analysis check, as sanitizeHtml
            // is a robust sanitization function that uses DOMPurify under the hood.
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(converter.toHtml(line)) }}
          />
        ))}
      </div>
    </div>
  );
}
