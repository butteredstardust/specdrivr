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
import type { SpecStatus } from '@/components/specs/spec-editor';
import type { UserRole } from '@/db/schema';

interface Spec {
  id: number;
  title: string;
  content: string;
  status: SpecStatus;
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

function statusBadgeClass(status: SpecStatus): string {
  switch (status) {
    case 'drafting':
      return 'text-text-muted';
    case 'pending_plan':
      return 'text-phosphor-amber animate-[blink_1s_ease-in-out_infinite]';
    case 'pending_approval':
      return 'text-phosphor-amber';
    case 'executing':
      return 'text-accent-violet animate-[blink_1s_ease-in-out_infinite]';
    case 'completed':
      return 'text-emerald-400';
    case 'stalled':
      return 'text-orange-400';
    case 'archived':
      return 'text-text-muted opacity-50';
    default:
      return 'text-text-muted';
  }
}

export default function SpecDetailPage(): React.ReactElement {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useShell();

  const rawId = params['id'];
  const specId = typeof rawId === 'string' ? parseInt(rawId, 10) : NaN;

  const activeTab = (searchParams.get('tab') ?? 'spec') as TabName;
  const userRole = (user.role ?? 'viewer') as UserRole;

  const [spec, setSpec] = useState<Spec | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  // Initial fetch
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
        if (!cancelled) setSpec(json.data ?? json);
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
    };
  }, [specId, router]);

  // Poll when pending_plan
  const { data: polledSpec } = usePolling<Spec>({
    url: spec?.status === 'pending_plan' ? `/api/v1/specs/${specId}` : null,
    interval: 3000,
    stopWhen: (s) => s?.status !== 'pending_plan',
    onData: (s) => setSpec(s),
  });

  // Keep spec updated from poll
  useEffect(() => {
    if (polledSpec) setSpec(polledSpec);
  }, [polledSpec]);

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
      className="flex items-center gap-1.5"
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
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="text-text-muted flex items-center gap-1.5 font-mono text-xs">
        <Link href="/specs" className="hover:text-text-secondary transition-colors">
          Specs
        </Link>
        <span>/</span>
        {isLoading ? (
          <Skeleton className="h-3 w-32" />
        ) : (
          <span className="text-text-secondary">{spec?.title ?? '…'}</span>
        )}
      </nav>

      {/* Header */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-text-primary text-xl font-semibold">{spec?.title ?? 'Untitled'}</h1>
            {spec && (
              <span className={`font-mono text-xs ${statusBadgeClass(spec.status)}`}>
                {spec.status.replace(/_/g, ' ')}
              </span>
            )}
          </div>
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
        </div>
      )}

      {/* Tabs */}
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
              className="data-[state=active]:border-accent-violet data-[state=active]:text-text-primary text-text-muted hover:text-text-secondary rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 font-mono text-xs tracking-widest shadow-none transition-colors"
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
          ) : spec ? (
            <>
              <TabsContent value="spec" className="mt-0">
                <SpecTab spec={spec} userRole={userRole} />
              </TabsContent>
              <TabsContent value="plan" className="mt-0">
                <PlanTab spec={spec} userRole={userRole} />
              </TabsContent>
              <TabsContent value="tasks" className="mt-0">
                <TasksTab specId={spec.id} userRole={userRole} />
              </TabsContent>
              <TabsContent value="changes" className="mt-0">
                <ChangesTab specId={spec.id} />
              </TabsContent>
              <TabsContent value="activity" className="mt-0">
                <ActivityTab specId={spec.id} specStatus={spec.status} />
              </TabsContent>
            </>
          ) : null}
        </div>
      </Tabs>
    </div>
  );
}
