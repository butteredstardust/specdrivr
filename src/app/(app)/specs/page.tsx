'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  const base = 'font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded';
  switch (status) {
    case 'drafting':
      return <span className={`${base} bg-secondary text-muted-foreground`}>Draft</span>;
    case 'pending_plan':
      return <span className={`${base} text-phosphor-amber bg-phosphor-amber/10`}>Pending</span>;
    case 'pending_approval':
      return <span className={`${base} text-phosphor-amber bg-phosphor-amber/10`}>Review</span>;
    case 'executing':
      return <span className={`${base} text-primary bg-primary/10`}>Running</span>;
    case 'completed':
      return <span className={`${base} text-status-emerald bg-status-emerald/10`}>Done</span>;
    case 'stalled':
      return <span className={`${base} text-status-red bg-status-red/10`}>Stalled</span>;
    case 'archived':
      return (
        <span className={`${base} bg-secondary text-muted-foreground opacity-60`}>Archived</span>
      );
    default:
      return <span className={`${base} bg-secondary text-muted-foreground`}>{status}</span>;
  }
}

function SpecIdBadge({ id }: { id: number }) {
  return (
    <code className="bg-phosphor-amber/10 text-phosphor-amber inline-flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs">
      SPEC-{String(id).padStart(3, '0')}
    </code>
  );
}

export default function SpecsPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeProjectId, setActiveProjectId, user } = useShell();
  const userRole = (user.role ?? 'viewer') as UserRole;

  const urlProjectId = searchParams.get('projectId')
    ? parseInt(searchParams.get('projectId')!, 10)
    : null;

  useEffect(() => {
    if (urlProjectId !== null && activeProjectId !== urlProjectId) {
      setActiveProjectId(urlProjectId);
    }
  }, [urlProjectId, activeProjectId, setActiveProjectId]);

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
      size="sm"
      disabled={!canCreate}
      onClick={canCreate ? () => router.push('/specs/new') : undefined}
      aria-disabled={!canCreate}
      className="gap-1.5"
    >
      <Plus className="h-3.5 w-3.5" />
      New Spec
    </Button>
  );

  return (
    // Escape the layout's p-6 so sections are full-bleed with border separators
    <div className="-mx-6 -mt-6 flex min-h-full flex-col">
      {/* Header */}
      <div className="border-border-default flex items-center justify-between border-b px-6 py-4">
        <div>
          <div className="text-muted-foreground mb-1 font-mono text-[10px] tracking-[0.2em] uppercase">
            Specifications
          </div>
          <h1 className="text-foreground text-xl font-semibold">Specs</h1>
        </div>
        <TooltipProvider>
          {canCreate ? (
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
          )}
        </TooltipProvider>
      </div>

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
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-secondary data-[state=inactive]:text-muted-foreground hover:text-foreground h-auto rounded px-2.5 py-1 font-mono text-[10px] tracking-wider uppercase data-[state=active]:shadow-none"
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
              <div className="flex flex-col items-center gap-4 py-16">
                <DaemonMascot size={48} expression="idle" />
                <p className="text-muted-foreground font-mono text-sm">
                  Select a project to view specs.
                </p>
              </div>
            ) : isLoading ? (
              <div className="text-muted-foreground py-8 text-center font-mono text-xs">
                Loading…
              </div>
            ) : filteredSpecs.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16">
                <DaemonMascot size={48} expression="idle" />
                <p className="text-muted-foreground font-mono text-sm">No specs yet.</p>
              </div>
            ) : (
              <Table className="caption-bottom text-sm">
                <TableHeader>
                  <TableRow className="border-border-default hover:bg-transparent">
                    <TableHead className="text-muted-foreground h-auto w-36 px-6 py-2.5 font-mono text-[10px] font-medium tracking-[0.15em] uppercase">
                      ID
                    </TableHead>
                    <TableHead className="text-muted-foreground h-auto px-3 py-2.5 font-mono text-[10px] font-medium tracking-[0.15em] uppercase">
                      Name
                    </TableHead>
                    <TableHead className="text-muted-foreground h-auto w-36 px-3 py-2.5 font-mono text-[10px] font-medium tracking-[0.15em] uppercase">
                      Status
                    </TableHead>
                    <TableHead className="text-muted-foreground h-auto w-16 px-3 py-2.5 font-mono text-[10px] font-medium tracking-[0.15em] uppercase">
                      v
                    </TableHead>
                    <TableHead className="text-muted-foreground h-auto w-24 px-3 py-2.5 font-mono text-[10px] font-medium tracking-[0.15em] uppercase">
                      Tasks
                    </TableHead>
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
                        <SpecIdBadge id={spec.id} />
                      </TableCell>
                      <TableCell className="text-foreground px-3 py-3 text-sm">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground h-6 w-6"
                          asChild
                        >
                          <Link href={`/specs/${spec.id}`} onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
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
  );
}
