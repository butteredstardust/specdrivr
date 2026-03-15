'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import Link from 'next/link';
import type { UserRole, SpecStatus } from '@/db/schema';

interface Spec {
  id: number;
  name: string;
  status: SpecStatus;
  createdAt: string;
  updatedAt: string;
}

const ALL_STATUSES: SpecStatus[] = [
  'drafting',
  'pending_plan',
  'pending_approval',
  'executing',
  'completed',
  'stalled',
  'archived',
];

function statusBadgeClass(status: SpecStatus): string {
  switch (status) {
    case 'drafting':
      return 'text-[--text-muted]';
    case 'pending_plan':
      return 'text-[--phosphor-amber] animate-[blink_1s_ease-in-out_infinite]';
    case 'pending_approval':
      return 'text-[--phosphor-amber]';
    case 'executing':
      return 'text-[--accent-violet] animate-[blink_1s_ease-in-out_infinite]';
    case 'completed':
      return 'text-emerald-400';
    case 'stalled':
      return 'text-orange-400';
    case 'archived':
      return 'text-[--text-muted] opacity-50';
    default:
      return 'text-[--text-muted]';
  }
}

function statusLabel(status: SpecStatus): string {
  return status.replace(/_/g, ' ');
}

export default function SpecsPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeProjectId, setActiveProjectId, user } = useShell();
  const userRole = (user.role ?? 'viewer') as UserRole;

  const urlProjectId = searchParams.get('projectId')
    ? parseInt(searchParams.get('projectId')!, 10)
    : null;

  // Sync URL ?projectId into shell context so the sidebar picker also updates
  useEffect(() => {
    if (urlProjectId !== null && activeProjectId !== urlProjectId) {
      setActiveProjectId(urlProjectId);
    }
  }, [urlProjectId, activeProjectId, setActiveProjectId]);

  const effectiveProjectId = activeProjectId ?? urlProjectId;

  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');

  const specsUrl =
    effectiveProjectId !== null ? `/api/v1/specs?projectId=${effectiveProjectId}` : null;

  const { data: specs, isLoading } = usePolling<Spec[]>({
    url: specsUrl,
    interval: 5000,
  });

  const canCreate = userRole === 'member' || userRole === 'admin' || userRole === 'owner';

  const filteredSpecs = (specs ?? []).filter((spec) => {
    const matchesTab = activeTab === 'all' || spec.status === activeTab;
    const matchesSearch = spec.name.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const newSpecButton = (
    <Button
      size="sm"
      disabled={!canCreate}
      onClick={canCreate ? () => router.push('/specs/new') : undefined}
      aria-disabled={!canCreate}
    >
      New Spec
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">SPECS</h1>
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

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search specs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap gap-1">
          <TabsTrigger value="all">All</TabsTrigger>
          {ALL_STATUSES.map((status) => (
            <TabsTrigger key={status} value={status}>
              {statusLabel(status)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab}>
          {effectiveProjectId === null ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <DaemonMascot size={48} expression="idle" />
              <p className="font-mono text-sm text-[--text-secondary]">
                Select a project to view specs.
              </p>
            </div>
          ) : isLoading ? (
            <div className="py-8 text-center font-mono text-xs text-[--text-muted]">Loading…</div>
          ) : filteredSpecs.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <DaemonMascot size={48} expression="idle" />
              <p className="font-mono text-sm text-[--text-secondary]">No specs yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSpecs.map((spec) => (
                  <TableRow
                    key={spec.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/specs/${spec.id}`)}
                  >
                    <TableCell className="font-mono text-sm">{spec.name}</TableCell>
                    <TableCell>
                      <span className={`font-mono text-xs ${statusBadgeClass(spec.status)}`}>
                        {statusLabel(spec.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-[--text-secondary]">
                      {new Date(spec.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-[--text-secondary]">
                      {new Date(spec.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/specs/${spec.id}`}
                        className="text-xs text-[--accent-violet] hover:underline"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
