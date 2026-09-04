'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { StatusIcon } from '@/components/ui/status-icon';
import { Button } from '@/components/ui/button';
import type { Highlighter } from 'shiki';

// Module-scope singleton
let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(({ createHighlighter }) =>
      createHighlighter({
        themes: ['github-dark'],
        langs: [
          'diff',
          'typescript',
          'javascript',
          'python',
          'go',
          'rust',
          'css',
          'html',
          'json',
          'bash',
        ],
      })
    );
  }
  return highlighterPromise;
}

interface DiffFile {
  filename: string;
  patch: string;
  additions: number;
  deletions: number;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
}

interface DiffViewerProps {
  files: DiffFile[];
  className?: string;
}

function renderDiffLines(patch: string): React.ReactNode[] {
  return patch.split('\n').map((line, i) => {
    let className = 'text-fg-secondary px-2';
    if (line.startsWith('+') && !line.startsWith('+++'))
      className = 'bg-[var(--bg-diff-added)] text-success px-2';
    else if (line.startsWith('-') && !line.startsWith('---'))
      className = 'bg-[var(--bg-diff-deleted)] text-danger px-2';
    else if (line.startsWith('@@')) className = 'text-fg-muted px-2';
    return (
      <div key={i} className={`font-mono text-xs leading-5 whitespace-pre ${className}`}>
        {line || ' '}
      </div>
    );
  });
}

const statusPrefix: Record<DiffFile['status'], string> = {
  added: '+',
  modified: '~',
  deleted: '-',
  renamed: '~',
};

const statusColor: Record<DiffFile['status'], string> = {
  added: 'text-success',
  modified: 'text-warning',
  deleted: 'text-danger',
  renamed: 'text-warning',
};

export function DiffViewer({ files, className }: DiffViewerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(files[0]?.filename ?? null);

  const selected = files.find((f) => f.filename === selectedFile);
  const totalAdditions = files.reduce((s, f) => s + f.additions, 0);
  const totalDeletions = files.reduce((s, f) => s + f.deletions, 0);

  if (files.length === 0) {
    return (
      <div
        className={cn(
          'text-fg-muted flex flex-col items-center justify-center gap-3 p-8',
          className
        )}
      >
        <StatusIcon size={20} status="idle" />
        <span className="text-sm">No file changes.</span>
      </div>
    );
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="border-line flex items-center gap-3 border-b px-4 py-2">
        <span className="text-fg-muted font-mono text-xs font-semibold tracking-widest uppercase">
          FILE CHANGES
        </span>
        <span className="text-success font-mono text-xs">+{totalAdditions}</span>
        <span className="text-danger font-mono text-xs">−{totalDeletions}</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File tree */}
        <div className="border-line w-56 shrink-0 overflow-y-auto border-r">
          {files.map((file, i) => (
            <Button
              key={`${file.filename}-${i}`}
              variant="ghost"
              onClick={() => setSelectedFile(file.filename)}
              className={cn(
                'flex h-auto w-full items-center justify-start gap-1.5 truncate rounded-none px-3 py-2 text-left font-mono text-xs',
                selectedFile === file.filename
                  ? 'bg-surface-inset/10 text-accent hover:bg-surface-inset/15'
                  : 'text-fg-secondary hover:bg-surface-inset'
              )}
            >
              <span className={statusColor[file.status]}>{statusPrefix[file.status]}</span>
              <span className="truncate">{file.filename}</span>
            </Button>
          ))}
        </div>

        {/* Diff content */}
        <div className="bg-surface-base flex-1 overflow-auto">
          {selected ? (
            <div>{renderDiffLines(selected.patch)}</div>
          ) : (
            <div className="text-fg-muted p-4 text-sm">Select a file to view changes.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export getHighlighter for potential future use (SSR preloading, etc.)
export { getHighlighter };
