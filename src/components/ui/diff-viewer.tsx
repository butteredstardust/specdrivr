'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
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
    let className = 'text-text-secondary px-2';
    if (line.startsWith('+') && !line.startsWith('+++'))
      className = 'bg-green-950/40 text-green-400 px-2';
    else if (line.startsWith('-') && !line.startsWith('---'))
      className = 'bg-red-950/40 text-red-400 px-2';
    else if (line.startsWith('@@')) className = 'text-text-muted px-2';
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
  added: 'text-green-400',
  modified: 'text-phosphor-amber',
  deleted: 'text-status-red',
  renamed: 'text-phosphor-amber',
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
          'text-text-muted flex flex-col items-center justify-center gap-3 p-8',
          className
        )}
      >
        <DaemonMascot size={32} expression="idle" />
        <span className="text-sm">No file changes.</span>
      </div>
    );
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="border-border-default flex items-center gap-3 border-b px-4 py-2">
        <span className="text-text-muted font-mono text-xs font-semibold tracking-widest uppercase">
          FILE CHANGES
        </span>
        <span className="font-mono text-xs text-green-400">+{totalAdditions}</span>
        <span className="text-status-red font-mono text-xs">−{totalDeletions}</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File tree */}
        <div className="border-border-default w-56 shrink-0 overflow-y-auto border-r">
          {files.map((file) => (
            <button
              key={file.filename}
              onClick={() => setSelectedFile(file.filename)}
              className={cn(
                'flex w-full items-center gap-1.5 truncate px-3 py-2 text-left font-mono text-xs',
                selectedFile === file.filename
                  ? 'bg-accent-violet/10 text-accent-violet'
                  : 'text-text-secondary hover:bg-bg-elevated'
              )}
            >
              <span className={statusColor[file.status]}>{statusPrefix[file.status]}</span>
              <span className="truncate">{file.filename}</span>
            </button>
          ))}
        </div>

        {/* Diff content */}
        <div className="bg-bg-base flex-1 overflow-auto">
          {selected ? (
            <div>{renderDiffLines(selected.patch)}</div>
          ) : (
            <div className="text-text-muted p-4 text-sm">Select a file to view changes.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export getHighlighter for potential future use (SSR preloading, etc.)
export { getHighlighter };
