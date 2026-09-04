'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState, parseAsString } from 'nuqs';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { StatusIcon } from '@/components/ui/status-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, MoreHorizontal, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { UserRole, SpecStatus } from '@/db/schema';

export interface Spec {
  id: number;
  name: string;
  status: SpecStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
  taskCount?: number | null;
  currentVersionNumber?: number | null;
}

const STATUS_TABS: Array<{ value: string; label: string; status?: SpecStatus }> = [
  { value: 'all', label: 'All' },
  { value: 'drafting', label: 'Drafting', status: 'drafting' },
  { value: 'pending', label: 'Pending' },
  { value: 'executing', label: 'Executing', status: 'executing' },
  { value: 'completed', label: 'Complete', status: 'completed' },
  { value: 'stalled', label: 'Stalled', status: 'stalled' },
  { value: 'archived', label: 'Archived', status: 'archived' },
];

function StatusBadge({ status }: { status: SpecStatus }) {
  switch (status) {
    case 'drafting':
      return <Badge>Draft</Badge>;
    case 'pending_plan':
    case 'pending_approval':
      return <Badge variant="warning">Pending</Badge>;
    case 'executing':
      return (
        <Badge variant="info" dot>
          Running
        </Badge>
      );
    case 'completed':
      return <Badge variant="success">Done</Badge>;
    case 'stalled':
      return <Badge variant="danger">Stalled</Badge>;
    case 'archived':
      return <Badge variant="muted">Archived</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function SpecsClient({ initialSpecs }: { initialSpecs?: Spec[] }): React.ReactElement {
  const router = useRouter();
  // Source of truth for project is the shell (which manages state and cookies)
  const { activeProjectId, user } = useShell();
  const userRole = (user.role ?? 'viewer') as UserRole;

  // Optional: Sync activeProjectId to URL for deep linking/bookmarking support
  useEffect(() => {
    if (activeProjectId !== null) {
      const url = new URL(window.location.href);
      if (url.searchParams.get('projectId') !== String(activeProjectId)) {
        url.searchParams.set('projectId', String(activeProjectId));
        router.replace(url.pathname + url.search, { scroll: false });
      }
    }
  }, [activeProjectId, router]);

  const effectiveProjectId = activeProjectId;

  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({
      shallow: true,
      history: 'replace',
      throttleMs: 300,
    })
  );

  const specsUrl =
    effectiveProjectId !== null ? `/api/v1/specs?projectId=${effectiveProjectId}` : null;

  const { data: specs, isLoading } = usePolling<Spec[]>({
    url: specsUrl,
    interval: 5000,
    initialData: initialSpecs,
  });

  const canCreate = userRole === 'member' || userRole === 'admin' || userRole === 'owner';

  const allSpecs = useMemo(() => specs ?? [], [specs]);

  const countByStatus = (value: string, status?: SpecStatus) => {
    if (value === 'all') return allSpecs.length;
    if (value === 'pending') {
      return allSpecs.filter((s) => s.status === 'pending_plan' || s.status === 'pending_approval')
        .length;
    }
    return status ? allSpecs.filter((s) => s.status === status).length : 0;
  };

  const filteredSpecs = useMemo(() => {
    let result = allSpecs;

    // Filter by tab
    if (activeTab === 'pending') {
      result = result.filter((s) => s.status === 'pending_plan' || s.status === 'pending_approval');
    } else if (activeTab !== 'all') {
      result = result.filter((s) => s.status === activeTab);
    }

    // Filter by search
    if (search) {
      const term = search.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(term));
    }

    return result;
  }, [allSpecs, activeTab, search]);

  const newSpecButton = (
    <Button
      variant="warning"
      size="sm"
      disabled={!canCreate}
      onClick={canCreate ? () => router.push('/specs/new') : undefined}
      aria-disabled={!canCreate}
      className="gap-2"
    >
      <Plus className="h-3.5 w-3.5" />
      New Specification
    </Button>
  );

  return (
    <TooltipProvider>
      {/* Escape the layout's p-6 so sections are full-bleed with border separators */}
      <div className="animate-fade-in-up -mx-6 -mt-6 flex min-h-full flex-col">
        <PageHeader
          category="Specifications"
          title="Specs"
          action={
            canCreate ? (
              newSpecButton
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>{newSpecButton}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Only members, admins, and owners can create specs.</p>
                </TooltipContent>
              </Tooltip>
            )
          }
        />

        {/* Toolbar: Search + Filter tabs */}
        <div className="border-line flex flex-wrap items-center gap-4 border-b px-6 py-3">
          {/* Search */}
          <div className="relative w-64">
            <Search className="text-fg-muted absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
            <Input
              placeholder="SEARCH SPECS..."
              className="bg-surface-inset h-8 pl-8 font-mono text-[10px] tracking-[0.08em] uppercase transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value || null)}
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearch(null)}
                className="text-fg-muted hover:text-fg absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="bg-line/50 mx-1 h-4 w-px" />

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5">
            {STATUS_TABS.map(({ value, label, status }) => {
              const count = countByStatus(value, status);
              const isActive = activeTab === value;
              return (
                <Button
                  key={value}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(value)}
                  className={cn(
                    'h-7 px-3 font-mono text-[10px] tracking-[0.08em] uppercase transition-all',
                    isActive
                      ? 'bg-surface-inset text-white'
                      : 'text-fg-muted hover:bg-surface-inset hover:text-fg'
                  )}
                >
                  {label}
                  {count > 0 && <span className="ml-1.5 opacity-50">{count}</span>}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="border-line flex-1 border">
          {effectiveProjectId === null ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <StatusIcon size={24} status="idle" />
              <p className="text-fg-secondary font-mono text-sm">No project selected.</p>
              <p className="text-fg-muted font-mono text-xs italic">
                &quot;Select a project from the sidebar to view specifications.&quot;
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-fg-muted py-8 text-center font-mono text-xs">Loading…</div>
          ) : filteredSpecs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <StatusIcon size={24} status="idle" />
              <p className="text-fg-secondary font-mono text-sm">No specs yet.</p>
              <p className="text-fg-muted font-mono text-xs italic">
                &quot;Create your first specification to begin building.&quot;
              </p>
            </div>
          ) : (
            <Table className="caption-bottom text-sm">
              <TableHeader>
                <TableRow className="border-line text-fg-muted font-mono text-[11px] tracking-[0.08em] uppercase hover:bg-transparent">
                  <TableHead className="h-auto w-36 px-6 py-2.5 font-medium">ID</TableHead>
                  <TableHead className="h-auto px-3 py-2.5 font-medium">Name</TableHead>
                  <TableHead className="h-auto w-36 px-3 py-2.5 font-medium">Status</TableHead>
                  <TableHead className="h-auto w-16 px-3 py-2.5 font-medium">v</TableHead>
                  <TableHead className="h-auto w-24 px-3 py-2.5 font-medium">Tasks</TableHead>
                  <TableHead className="h-auto w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSpecs.map((spec) => (
                  <TableRow
                    key={spec.id}
                    className="border-line/50 hover:bg-surface-inset/50 cursor-pointer"
                    onClick={() => router.push(`/specs/${spec.id}`)}
                  >
                    <TableCell className="px-6 py-3">
                      <Badge variant="warning">SPEC-{String(spec.id).padStart(3, '0')}</Badge>
                    </TableCell>
                    <TableCell className="text-fg px-3 py-3 text-sm">{spec.name}</TableCell>
                    <TableCell className="px-3 py-3">
                      <StatusBadge status={spec.status} />
                    </TableCell>
                    <TableCell className="text-fg-muted px-3 py-3 font-mono text-[10px]">
                      {spec.currentVersionNumber ? `v${spec.currentVersionNumber}` : '—'}
                    </TableCell>
                    <TableCell className="text-fg-muted px-3 py-3 font-mono text-[10px]">
                      {spec.taskCount != null ? `${spec.taskCount}` : '—'}
                    </TableCell>
                    <TableCell
                      className="px-3 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-fg-muted h-6 w-6"
                            asChild
                          >
                            <Link href={`/specs/${spec.id}`} onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View spec details</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
