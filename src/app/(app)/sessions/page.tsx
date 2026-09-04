'use client';

import { Suspense } from 'react';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { PageHeader } from '@/components/ui/page-header';
import { SessionsFilterBar } from './components/sessions-filter-bar';
import { SessionsTable } from './components/sessions-table';
import { Session } from './types';
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs';

const TERMINAL_STATUSES: readonly string[] = ['completed', 'failed', 'cancelled'];

function SessionsContent() {
  const { activeProjectId } = useShell();

  // Read URL params via nuqs to build the fetch URL
  const [search] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({ shallow: true })
  );
  const [status] = useQueryState(
    'status',
    parseAsString.withDefault('all').withOptions({ shallow: true })
  );
  const [specId] = useQueryState(
    'specId',
    parseAsString.withDefault('all').withOptions({ shallow: true })
  );
  const [from] = useQueryState(
    'from',
    parseAsString.withDefault('').withOptions({ shallow: true })
  );
  const [to] = useQueryState('to', parseAsString.withDefault('').withOptions({ shallow: true }));
  const [page] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ shallow: true })
  );
  const limit = 50;

  const buildFetchUrl = () => {
    if (!activeProjectId) return null;

    const params = new URLSearchParams();
    params.set('projectId', String(activeProjectId));
    if (search) params.set('search', search);
    if (status !== 'all') params.set('status', status);
    if (specId !== 'all') params.set('specId', specId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    params.set('limit', String(limit));
    params.set('offset', String((page - 1) * limit));

    return `/api/v1/sessions?${params.toString()}`;
  };

  const sessionsUrl = buildFetchUrl();

  const {
    data: sessions,
    isLoading,
    error,
  } = usePolling<Session[]>({
    url: sessionsUrl,
    interval: 3000,
    stopWhen: (data) =>
      Array.isArray(data) &&
      data.length > 0 &&
      data.every((s) => TERMINAL_STATUSES.includes(s.status)),
  });

  const { data: specsData } = usePolling<Array<{ id: number; name: string }>>({
    url: activeProjectId ? `/api/v1/specs?projectId=${activeProjectId}` : null,
    interval: 60000,
  });
  const specs = specsData ?? [];

  return (
    <div className="animate-fade-in-up -mx-6 -mt-6 flex min-h-full flex-col">
      <PageHeader category="Executor" title="Sessions" />

      <SessionsFilterBar specs={specs} />

      <div className="border-line flex-1 border">
        <SessionsTable
          sessions={sessions}
          isLoading={isLoading}
          error={error}
          activeProjectId={activeProjectId}
        />
      </div>
    </div>
  );
}

export default function SessionsPage() {
  return (
    <Suspense>
      <SessionsContent />
    </Suspense>
  );
}
