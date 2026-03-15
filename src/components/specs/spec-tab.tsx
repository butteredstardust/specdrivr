'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil } from 'lucide-react';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
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

function wordCount(text: string | undefined): number {
  if (!text) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export function SpecTab({ spec, userRole }: SpecTabProps): React.ReactElement {
  const canEdit = userRole !== 'viewer';
  const [content, setContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchContent = async () => {
      setIsLoadingContent(true);
      try {
        const res = await fetch(`/api/v1/specs/${spec.id}/versions`, { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        const versions: SpecVersion[] = json.data ?? [];
        if (!cancelled && versions.length > 0) {
          // Versions are ordered descending by version number — pick the first (latest)
          setContent(versions[0]?.markdownContent ?? null);
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

  const editButton = (
    <Button
      asChild={canEdit}
      variant="outline"
      size="sm"
      disabled={!canEdit}
      aria-disabled={!canEdit}
      className="w-full gap-1.5"
    >
      {canEdit ? (
        <Link href={`/specs/${spec.id}/edit`}>
          <Pencil className="h-3.5 w-3.5" />
          Edit Spec
        </Link>
      ) : (
        <span className="flex items-center gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Edit Spec
        </span>
      )}
    </Button>
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Main content */}
      <div className="min-w-0 flex-1">
        {isLoadingContent ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        ) : content ? (
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-16">
            <DaemonMascot size={48} expression="idle" />
            <p className="text-muted-foreground font-mono text-sm">No content yet.</p>
            {canEdit && (
              <Button asChild size="sm" variant="outline">
                <Link href={`/specs/${spec.id}/edit`}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Write spec
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Metadata sidebar */}
      <aside className="w-full shrink-0 space-y-4 lg:w-56">
        <div className="border-border bg-secondary/30 space-y-3 rounded-md border p-4">
          <div>
            <p className="text-muted-foreground mb-1 font-mono text-xs tracking-widest uppercase">
              Status
            </p>
            <span className="text-foreground font-mono text-xs">
              {spec.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div>
            <p className="text-muted-foreground mb-1 font-mono text-xs tracking-widest uppercase">
              Word Count
            </p>
            <span className="text-muted-foreground font-mono text-xs">
              {wordCount(content ?? undefined).toLocaleString()}
            </span>
          </div>

          <div>
            <p className="text-muted-foreground mb-1 font-mono text-xs tracking-widest uppercase">
              Created
            </p>
            <span className="text-muted-foreground font-mono text-xs">
              {new Date(spec.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div>
            <p className="text-muted-foreground mb-1 font-mono text-xs tracking-widest uppercase">
              Updated
            </p>
            <span className="text-muted-foreground font-mono text-xs">
              {new Date(spec.updatedAt).toLocaleDateString()}
            </span>
          </div>

          <TooltipProvider>
            {canEdit ? (
              editButton
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-block w-full">
                    {editButton}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Viewers cannot edit specs</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </aside>
    </div>
  );
}
