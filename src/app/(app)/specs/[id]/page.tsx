'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil } from 'lucide-react';
import { SpecTab } from '@/components/specs/spec-tab';
import { PlanTab } from '@/components/specs/plan-tab';
import { TasksTab } from '@/components/specs/tasks-tab';
import { ChangesTab } from '@/components/specs/changes-tab';
import { ActivityTab } from '@/components/specs/activity-tab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PixelBadge } from '@/components/ui/pixel-badge';
import type { SpecStatus } from '@/components/specs/spec-editor';
import type { UserRole } from '@/db/schema';

interface Spec {
  id: number;
  name: string;
  status: SpecStatus;
  currentVersionId: number | null;
  createdAt: string;
  updatedAt: string;
}

type TabName = 'spec' | 'plan' | 'tasks' | 'changes' | 'activity';

const TABS: { id: TabName; label: string }[] = [
  { id: 'spec', label: 'SPEC' },
  { id: 'plan', label: 'PLAN' },
  { id: 'tasks', label: 'TASKS' },
  { id: 'changes', label: 'CHANGES' },
  { id: 'activity', label: 'ACTIVITY' },
];

function StatusBadge({ status }: { status: SpecStatus }) {
  switch (status) {
    case 'drafting':
      return <PixelBadge variant="muted">Draft</PixelBadge>;
    case 'pending_plan':
    case 'pending_approval':
      return <PixelBadge variant="amber">Pending</PixelBadge>;
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
      return <PixelBadge variant="muted">{status}</PixelBadge>;
  }
}

export default function SpecDetailPage(): React.ReactElement {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, setPageLabel } = useShell();

  const rawId = params['id'];
  const specId = typeof rawId === 'string' ? parseInt(rawId, 10) : NaN;

  const activeTab = (searchParams.get('tab') ?? 'spec') as TabName;
  const userRole = (user.role ?? 'viewer') as UserRole;

  const [spec, setSpec] = useState<Spec | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    if (isNaN(specId)) {
      notFound();
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/specs/${specId}`, { credentials: 'include' });
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.status === 404) {
          if (!cancelled) setNotFoundState(true);
          return;
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        const loaded: Spec = json.data ?? json;
        if (!cancelled) {
          setSpec(loaded);
          setPageLabel(loaded.name);
        }
      } catch (err) {
        clientLogger.error('SpecDetailPage: failed to load spec', err);
        toast.error('Failed to load spec.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      setPageLabel(null);
    };
  }, [specId, router, setPageLabel]);

  const { data: polledSpec } = usePolling<Spec>({
    url: spec?.status === 'pending_plan' ? `/api/v1/specs/${specId}` : null,
    interval: 3000,
    stopWhen: (s) => s?.status !== 'pending_plan',
  });

  const displayedSpec = polledSpec ?? spec;

  if (notFoundState) {
    notFound();
  }

  const canEdit = userRole !== 'viewer';

  const editButton = (
    <Button
      asChild={canEdit}
      variant="outline"
      size="sm"
      disabled={!canEdit}
      aria-disabled={!canEdit}
      className="gap-1.5"
    >
      {canEdit ? (
        <Link href={`/specs/${specId}/edit`}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Link>
      ) : (
        <span className="flex items-center gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </span>
      )}
    </Button>
  );

  return (
    <div className="-mx-6 -mt-6 flex min-h-full flex-col">
      <div className="border-border-default flex items-center justify-between border-b px-6 py-4">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-7 w-56" />
          </div>
        ) : (
          <div className="flex min-w-0 flex-col gap-1">
            <div className="text-text-muted mb-1 font-mono text-[11px] tracking-[0.08em] uppercase">
              Project Spec
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <h1 className="text-foreground truncate text-xl font-semibold">
                {displayedSpec?.name ?? '…'}
              </h1>
              <PixelBadge variant="amber" className="shrink-0">
                SPEC-{String(specId).padStart(3, '0')}
              </PixelBadge>
              {displayedSpec && <StatusBadge status={displayedSpec.status} />}
            </div>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-2">
          {!isLoading && (
            <>
              {displayedSpec?.status === 'pending_approval' && (
                <Button
                  size="sm"
                  className="border-phosphor-amber text-phosphor-amber hover:bg-phosphor-amber/10 border"
                  onClick={() => router.push(`/specs/${specId}?tab=plan`)}
                >
                  Review Plan →
                </Button>
              )}
              <TooltipProvider>
                {canEdit ? (
                  editButton
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>{editButton}</span>
                    </TooltipTrigger>
                    <TooltipContent>Viewers cannot edit specs</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 px-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => router.push(`/specs/${specId}?tab=${v}`)}
          className="w-full"
        >
          <TabsList className="border-border-default h-auto w-full justify-start gap-4 rounded-none border-b bg-transparent p-0">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:border-accent-violet data-[state=active]:text-foreground text-muted-foreground hover:text-foreground rounded-none border-b-2 border-transparent bg-transparent px-1 py-3 font-mono text-xs tracking-widest shadow-none transition-colors"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </div>
            ) : displayedSpec ? (
              <>
                <TabsContent value="spec" className="mt-0">
                  <SpecTab spec={displayedSpec} userRole={userRole} />
                </TabsContent>
                <TabsContent value="plan" className="mt-0">
                  <PlanTab spec={displayedSpec} userRole={userRole} />
                </TabsContent>
                <TabsContent value="tasks" className="mt-0">
                  <TasksTab specId={displayedSpec.id} userRole={userRole} />
                </TabsContent>
                <TabsContent value="changes" className="mt-0">
                  <ChangesTab specId={displayedSpec.id} />
                </TabsContent>
                <TabsContent value="activity" className="mt-0">
                  <ActivityTab specId={displayedSpec.id} specStatus={displayedSpec.status} />
                </TabsContent>
              </>
            ) : null}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
