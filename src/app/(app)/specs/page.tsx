'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { PixelBadge } from '@/components/ui/pixel-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import type { UserRole, SpecStatus } from '@/db/schema';

interface Spec {
  id: number;
  name: string;
  status: SpecStatus;
  createdAt: string;
  updatedAt: string;
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
      return <PixelBadge>Draft</PixelBadge>;
    case 'pending_plan':
      return <PixelBadge variant="amber">Pending</PixelBadge>;
    case 'pending_approval':
      return <PixelBadge variant="amber">Review</PixelBadge>;
    case 'executing':
      return (
        <PixelBadge variant="violet" dot>
          Running
        </PixelBadge>
      );
    case 'completed':
      return <PixelBadge variant="emerald">Done</PixelBadge>;
    case 'stalled':
      return <PixelBadge variant="red">Stalled</PixelBadge>;
    case 'archived':
      return <PixelBadge variant="muted">Archived</PixelBadge>;
    default:
      return <PixelBadge>{status}</PixelBadge>;
  }
}

export default function SpecsPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeProjectId, setActiveProjectId, user } = useShell();
  const userRole = (user.role ?? 'viewer') as UserRole;

  const urlProjectId = searchParams.get('projectId')
    ? parseInt(searchParams.get('projectId')!, 10)
    : null;

  // Sync URL and activeProjectId
  useEffect(() => {
    if (urlProjectId !== null && activeProjectId !== urlProjectId) {
      setActiveProjectId(urlProjectId);
    } else if (activeProjectId !== null && urlProjectId === null) {
      // If we have an active project but it's not in the URL, put it there
      router.replace(`/specs?projectId=${activeProjectId}`, { scroll: false });
    } else if (
      activeProjectId !== null &&
      urlProjectId !== null &&
      activeProjectId !== urlProjectId
    ) {
      // If they are both set but different, sidebar (activeProjectId) wins for the URL
      router.replace(`/specs?projectId=${activeProjectId}`, { scroll: false });
    }
  }, [urlProjectId, activeProjectId, setActiveProjectId, router]);

  const effectiveProjectId = activeProjectId ?? urlProjectId;

  const [activeTab, setActiveTab] = useState<string>('all');

  const specsUrl =
    effectiveProjectId !== null ? `/api/v1/specs?projectId=${effectiveProjectId}` : null;

  const { data: specs, isLoading } = usePolling<Spec[]>({
    url: specsUrl,
    interval: 5000,
  });

  const canCreate = userRole === 'member' || userRole === 'admin' || userRole === 'owner';

  const allSpecs = specs ?? [];
  const countByStatus = (value: string, status?: SpecStatus) => {
    if (value === 'pending') {
      return allSpecs.filter((s) => s.status === 'pending_plan' || s.status === 'pending_approval')
        .length;
    }
    return status ? allSpecs.filter((s) => s.status === status).length : allSpecs.length;
  };
  const filteredSpecs = allSpecs.filter((spec) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending')
      return spec.status === 'pending_plan' || spec.status === 'pending_approval';
    return spec.status === activeTab;
  });

  const newSpecButton = (
    <Button
      variant="phosphor"
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
      <div className="-mx-6 -mt-6 flex min-h-full flex-col">
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

        {/* Filter tabs */}
        <div className="border-border-default border-b px-6 py-2.5">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
              {STATUS_TABS.map(({ value, label, status }) => {
                const count = countByStatus(value, status);
                return (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-secondary data-[state=inactive]:text-text-secondary hover:text-text-primary h-auto rounded px-2.5 py-1 font-mono text-xs tracking-wider uppercase transition-all data-[state=active]:shadow-none"
                  >
                    {label}
                    {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Single shared content panel keyed by activeTab */}
            <TabsContent value={activeTab} className="mt-0">
              {effectiveProjectId === null ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <DaemonMascot size={48} expression="idle" />
                  <p className="text-text-secondary font-mono text-sm">No project selected.</p>
                  <p className="text-text-muted font-mono text-xs italic">
                    &quot;Select a project from the sidebar to view specifications.&quot;
                  </p>
                </div>
              ) : isLoading ? (
                <div className="text-muted-foreground py-8 text-center font-mono text-xs">
                  Loading…
                </div>
              ) : filteredSpecs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16">
                  <DaemonMascot size={48} expression="idle" />
                  <p className="text-text-secondary font-mono text-sm">No specs yet.</p>
                  <p className="text-text-muted font-mono text-xs italic">
                    &quot;Create your first specification to begin building.&quot;
                  </p>
                </div>
              ) : (
                <Table className="caption-bottom text-sm">
                  <TableHeader>
                    <TableRow className="border-border-default text-text-secondary font-mono text-xs tracking-[0.15em] uppercase hover:bg-transparent">
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
                        className="border-border-default/50 hover:bg-bg-elevated/50 cursor-pointer"
                        onClick={() => router.push(`/specs/${spec.id}`)}
                      >
                        <TableCell className="px-6 py-3">
                          <PixelBadge variant="amber">
                            SPEC-{String(spec.id).padStart(3, '0')}
                          </PixelBadge>
                        </TableCell>
                        <TableCell className="text-text-primary px-3 py-3 text-sm">
                          {spec.name}
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <StatusBadge status={spec.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground px-3 py-3 font-mono text-[10px]">
                          {spec.currentVersionNumber ? `v${spec.currentVersionNumber}` : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground px-3 py-3 font-mono text-[10px]">
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
                                className="text-muted-foreground h-6 w-6"
                                asChild
                              >
                                <Link
                                  href={`/specs/${spec.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}
