'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { StatusIcon } from '@/components/ui/status-icon';
import { cn } from '@/lib/utils';
import type { SpecStatus } from '@/components/specs/spec-editor';
import type { UserRole } from '@/db/schema';

interface SpecVersion {
  id: number;
  versionNumber: number;
  markdownContent: string;
  createdAt: string;
}

interface SpecTabProps {
  spec: {
    id: number;
    name: string;
    status: SpecStatus;
    currentVersionId: number | null;
    createdAt: string;
    updatedAt: string;
  };
  userRole: UserRole;
}

export function SpecTab({ spec, userRole }: SpecTabProps): React.ReactElement {
  const canEdit = userRole !== 'viewer';
  const [versions, setVersions] = useState<SpecVersion[]>([]);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchContent = async () => {
      setIsLoadingContent(true);
      try {
        const res = await fetch(`/api/v1/specs/${spec.id}/versions`, { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        const fetchedVersions: SpecVersion[] = json.data ?? [];
        if (!cancelled) {
          setVersions(fetchedVersions);
        }
      } finally {
        if (!cancelled) setIsLoadingContent(false);
      }
    };
    fetchContent();
    return () => {
      cancelled = true;
    };
  }, [spec.id]);

  const content = versions[selectedVersionIdx]?.markdownContent ?? null;

  return (
    <div className="flex flex-col">
      {/* Version picker */}
      {versions.length > 1 && (
        <div className="mb-4 flex gap-1.5">
          {versions.map((v, i) => (
            <Button
              key={v.id}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedVersionIdx(i)}
              className={cn(
                'h-auto rounded px-2 py-0.5 font-mono text-xs',
                selectedVersionIdx === i
                  ? 'bg-warning/20 text-warning hover:bg-warning/30 hover:text-warning'
                  : 'bg-surface-inset text-fg-muted hover:text-fg'
              )}
            >
              v{v.versionNumber}
            </Button>
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="min-w-0 flex-1">
        {isLoadingContent ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        ) : content ? (
          <div className="prose prose-invert animate-fade-in-up max-w-none">
            <ReactMarkdown
              components={{
                code({
                  _node,
                  inline,
                  className,
                  children,
                  ...props
                }: {
                  _node?: unknown;
                  inline?: boolean;
                  className?: string;
                  children?: React.ReactNode;
                }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline ? (
                    <div className="bg-surface-inset border-line my-6 overflow-hidden rounded-lg border">
                      {match && (
                        <div className="border-line bg-surface-raised flex items-center justify-between border-b px-4 py-1.5">
                          <span className="text-fg-muted font-mono text-[10px] tracking-widest uppercase">
                            {match[1]}
                          </span>
                        </div>
                      )}
                      <pre className="m-0 overflow-x-auto p-4 font-mono text-sm leading-relaxed">
                        <code className={cn('text-fg', className)} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <code
                      className={cn(
                        'bg-surface-inset border-line text-accent rounded border px-1.5 py-0.5 font-mono text-[0.9em]',
                        className
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-16">
            <StatusIcon size={24} status="idle" />
            <p className="text-fg-secondary font-mono text-sm">No content yet.</p>
            <p className="text-fg-muted mb-4 font-mono text-xs italic">
              &quot;Write a specification to begin plan generation.&quot;
            </p>
            {canEdit && (
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/specs/${spec.id}/edit`}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Write spec
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
