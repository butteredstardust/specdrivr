'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState, parseAsString, parseAsStringLiteral } from 'nuqs';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { StatusIcon } from '@/components/ui/status-icon';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import {
  FilterToolbar,
  FilterToolbarActions,
  FilterSearch,
  FilterTabs,
  FilterClearButton,
  type FilterTabOption,
} from '@/components/ui/filter-toolbar';
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
import { Plus, MoreHorizontal } from 'lucide-react';
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

/** The only values `?status=` accepts; anything else falls back to `all`. */
const STATUS_TAB_VALUES = [
  'all',
  'drafting',
  'pending',
  'executing',
  'completed',
  'stalled',
  'archived',
] as const;

type StatusTabValue = (typeof STATUS_TAB_VALUES)[number];

const STATUS_TABS: ReadonlyArray<{ value: StatusTabValue; label: string; status?: SpecStatus }> = [
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

  // In the URL like every other filter in the app: the tab used to be local
  // state, so a link to a filtered spec list silently reset to "All". Parsed
  // as a literal so a hand-edited `?status=bogus` shows every spec rather than
  // an empty table with no tab selected.
  const [activeTab, setActiveTab] = useQueryState(
    'status',
    parseAsStringLiteral(STATUS_TAB_VALUES)
      .withDefault('all')
      .withOptions({ shallow: true, history: 'replace' })
  );
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

  const statusTabs = useMemo<FilterTabOption<StatusTabValue>[]>(
    () =>
      STATUS_TABS.map(({ value, label, status }) => ({
        value,
        label,
        count:
          value === 'all'
            ? allSpecs.length
            : value === 'pending'
              ? allSpecs.filter(
                  (s) => s.status === 'pending_plan' || s.status === 'pending_approval'
                ).length
              : allSpecs.filter((s) => s.status === status).length,
      })),
    [allSpecs]
  );

  const isAnyFilterActive = search !== '' || activeTab !== 'all';

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
      New specification
    </Button>
  );

  return (
    <TooltipProvider>
      <div className="animate-fade-in-up full-bleed fill-shell flex flex-col">
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

        <FilterToolbar>
          <FilterSearch
            value={search}
            onValueChange={(value) => setSearch(value || null)}
            placeholder="Search specs…"
            label="Search specs"
          />

          <FilterTabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value === 'all' ? null : value)}
            options={statusTabs}
            label="Filter specs by status"
          />

          {isAnyFilterActive && (
            <FilterToolbarActions>
              <FilterClearButton
                onClear={() => {
                  setSearch(null);
                  setActiveTab(null);
                }}
              />
            </FilterToolbarActions>
          )}
        </FilterToolbar>

        <div className="border-line flex-1 border">
          {effectiveProjectId === null ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <StatusIcon size={24} status="idle" />
              <p className="text-fg-secondary text-sm">No project selected.</p>
              <p className="text-fg-muted font-mono text-xs italic">
                &quot;Select a project from the sidebar to view specifications.&quot;
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-fg-muted py-8 text-center font-mono text-xs">Loading…</div>
          ) : filteredSpecs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <StatusIcon size={24} status="idle" />
              <p className="text-fg-secondary text-sm">No specs yet.</p>
              <p className="text-fg-muted font-mono text-xs italic">
                &quot;Create your first specification to begin building.&quot;
              </p>
            </div>
          ) : (
            <Table className="caption-bottom text-sm">
              <TableHeader>
                <TableRow className="border-line text-fg-muted text-2xs hover:bg-transparent">
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
                    className="border-line-subtle hover:bg-surface-inset cursor-pointer"
                    onClick={() => router.push(`/specs/${spec.id}`)}
                  >
                    <TableCell className="px-6 py-3">
                      <Badge variant="warning">SPEC-{String(spec.id).padStart(3, '0')}</Badge>
                    </TableCell>
                    <TableCell className="text-fg px-3 py-3 text-sm">{spec.name}</TableCell>
                    <TableCell className="px-3 py-3">
                      <StatusBadge status={spec.status} />
                    </TableCell>
                    <TableCell className="text-fg-muted text-2xs px-3 py-3 font-mono">
                      {spec.currentVersionNumber ? `v${spec.currentVersionNumber}` : '—'}
                    </TableCell>
                    <TableCell className="text-fg-muted text-2xs px-3 py-3 font-mono">
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
                            <Link
                              href={`/specs/${spec.id}`}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Open spec ${spec.name}`}
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
        </div>
      </div>
    </TooltipProvider>
  );
}
