'use client';

import React, { useEffect, useState } from 'react';
import { createHighlighter, type Highlighter } from 'shiki';
import { twMerge } from 'tailwind-merge';
import { PixelEmptyState } from '@pxlkit/ui-kit';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { clientLogger } from '@/lib/logger-client';

// Module-scoped highlighter promise to initialise only once
let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript', 'javascript', 'python', 'bash', 'json', 'css', 'html'],
    });
  }
  return highlighterPromise;
}

export type DiffViewerProps = {
  diff: string;
  language?: string;
  className?: string;
};

type ParsedLine = {
  content: string;
  type: 'add' | 'remove' | 'context' | 'header';
  highlightedHtml?: string;
};

export function DiffViewer({ diff, language = 'typescript', className }: DiffViewerProps) {
  const [lines, setLines] = useState<ParsedLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!diff) {
      setLines([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function processDiff() {
      try {
        const highlighter = await getHighlighter();
        if (!isMounted) return;

        const rawLines = diff.split('\n');
        const processedLines: ParsedLine[] = [];

        for (const line of rawLines) {
          if (line.startsWith('@@')) {
            processedLines.push({
              content: line,
              type: 'header',
            });
          } else if (line.startsWith('+') && !line.startsWith('+++')) {
            const code = line.substring(1);
            const html = highlighter.codeToHtml(code, {
              lang: language,
              theme: 'github-dark',
            });
            processedLines.push({
              content: line,
              type: 'add',
              highlightedHtml: stripPreTag(html),
            });
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            const code = line.substring(1);
            const html = highlighter.codeToHtml(code, {
              lang: language,
              theme: 'github-dark',
            });
            processedLines.push({
              content: line,
              type: 'remove',
              highlightedHtml: stripPreTag(html),
            });
          } else if (!line.startsWith('---') && !line.startsWith('+++')) {
            const code = line.startsWith(' ') ? line.substring(1) : line;
            const html = highlighter.codeToHtml(code, {
              lang: language,
              theme: 'github-dark',
            });
            processedLines.push({
              content: line,
              type: 'context',
              highlightedHtml: stripPreTag(html),
            });
          }
        }

        setLines(processedLines);
      } catch (error: unknown) {
        clientLogger.error('Failed to parse or highlight diff:', error);
        // Fallback to raw text without highlighting
        setLines(
          diff.split('\n').map(line => {
            if (line.startsWith('@@')) return { content: line, type: 'header' };
            if (line.startsWith('+') && !line.startsWith('+++')) return { content: line, type: 'add' };
            if (line.startsWith('-') && !line.startsWith('---')) return { content: line, type: 'remove' };
            return { content: line, type: 'context' };
          })
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    processDiff();

    return () => {
      isMounted = false;
    };
  }, [diff, language]);

  // Shiki output comes wrapped in <pre><code>, we strip it to compose our own lines safely
  const stripPreTag = (html: string) => {
    return html.replace(/<pre[^>]*><code[^>]*>/i, '').replace(/<\/code><\/pre>/i, '');
  };

  if (!diff) {
    return (
      <div className={twMerge('p-8 border border-[--border-default] rounded-md bg-[--bg-surface]', className)}>
        <PixelEmptyState
          title="No file changes yet." description="No changes to display."
          icon={<DaemonMascot size="lg" state="idle" />}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={twMerge('p-4 border border-[--border-default] rounded-md bg-[--bg-surface] text-[--text-muted] font-mono text-[13px]', className)}>
        Loading diff...
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        'terminal-surface font-mono text-[13px] bg-[--bg-surface] rounded-md overflow-x-auto border border-[--border-default]',
        className
      )}
    >
      <div className="min-w-max py-2 relative z-10">
        {lines.map((line, i) => {
          let lineClass = "px-4 py-0.5 whitespace-pre flex hover:bg-[--bg-elevated] transition-colors ";
          let prefix = " ";

          if (line.type === 'add') {
            lineClass += "bg-green-950/40 text-[--status-emerald]";
            prefix = "+";
          } else if (line.type === 'remove') {
            lineClass += "bg-red-950/40 text-[--status-red]";
            prefix = "-";
          } else if (line.type === 'header') {
            lineClass += "text-[--text-muted] italic bg-[--bg-base] mt-2 mb-1 border-y border-[--border-muted]";
            prefix = "";
          } else {
            lineClass += "text-[--text-primary]";
          }

          return (
            <div key={i} className={lineClass}>
              <span className="select-none text-[--text-muted] w-12 shrink-0 inline-block text-right pr-4 border-r border-[--border-muted] mr-4 opacity-50">
                {line.type !== 'header' ? i + 1 : ''}
              </span>
              <span className="w-4 shrink-0 select-none text-[--text-muted]">{prefix}</span>
              {line.highlightedHtml ? (
                <span dangerouslySetInnerHTML={{ __html: line.highlightedHtml }} />
              ) : (
                <span>{line.content.substring(line.type !== 'header' && line.content.length > 0 ? 1 : 0)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
