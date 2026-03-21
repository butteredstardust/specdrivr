'use client';

import { useRef, useEffect, useState } from 'react';
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
  return 'text-terminal-text';
}

export function TerminalLog({
  lines,
  className,
  maxHeight = '400px',
  autoScroll = true,
}: TerminalLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledRef = useRef(false);
  const [isFlickering, setIsFlickering] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsFlickering(false), 300);
    return () => clearTimeout(timer);
  }, []);

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
      className={cn(
        'terminal-surface border-border-default/50 overflow-y-auto rounded-lg border bg-[color:var(--terminal-bg)] p-4 shadow-2xl',
        className
      )}
      style={{ maxHeight }}
    >
      <div
        className={cn(
          'space-y-1 font-mono text-[12px] leading-relaxed tracking-tight',
          isFlickering && 'animate-terminal-flicker'
        )}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(getLineClass(line), 'transition-colors duration-150 hover:bg-white/5')}
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
