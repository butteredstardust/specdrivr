'use client';

import React, { useState, useEffect } from 'react';
import { usePolling } from '@/hooks/use-polling';
import { useShell } from '@/components/providers/shell-provider';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import {
  PixelInput,
  PixelBadge,
  PixelDropdown,
  PixelEmptyState,
  PixelButton,
} from '@pxlkit/ui-kit';
import { useRouter } from 'next/navigation';
// pxlkit fallback: no PixelSkeleton
import { Skeleton } from '@/components/ui/skeleton';

type SpecStatus =
  | 'drafting'
  | 'pending_plan'
  | 'pending_approval'
  | 'executing'
  | 'completed'
  | 'stalled'
  | 'archived';

interface SpecData {
  id: string;
  externalId: string;
  name: string;
  status: SpecStatus;
  version: string;
  completedTasks: number;
  totalTasks: number;
  lastRunRel: string;
}

export default function SpecsPage() {
  const router = useRouter();
  const { activeProjectId } = useShell();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading } = usePolling<{
    data: SpecData[];
    meta: { counts: Record<SpecStatus, number>; total: number; page: number };
  }>({
    url: activeProjectId
      ? `/api/v1/specs?projectId=${activeProjectId}&status=${activeFilter === 'all' ? '' : activeFilter}&search=${encodeURIComponent(debouncedSearch)}&page=${page}`
      : '',
    interval: 5000,
    enabled: !!activeProjectId,
  });

  const specs = data?.data || [];
  const meta = data?.meta;

  const getStatusBadgeTone = (status: SpecStatus) => {
    switch (status) {
      case 'drafting':
      case 'archived':
        return 'neutral';
      case 'pending_plan':
      case 'executing':
        return 'purple';
      case 'pending_approval':
        return 'gold';
      case 'stalled':
        return 'red';
      case 'completed':
        return 'green';
      default:
        return 'neutral';
    }
  };

  const getStatusBadgeLabel = (status: SpecStatus) => {
    switch (status) {
      case 'drafting':
        return 'DRAFT';
      case 'pending_plan':
        return 'GENERATING';
      case 'pending_approval':
        return 'REVIEW';
      case 'executing':
        return 'RUNNING';
      case 'stalled':
        return 'STALLED';
      case 'completed':
        return 'DONE';
      case 'archived':
        return 'ARCHIVED';
      default:
        return String(status).toUpperCase();
    }
  };

  const renderProgressBar = (completed: number, total: number) => {
    if (total === 0) return null;
    const filledChars = Math.round((completed / total) * 5);
    const emptyChars = 5 - filledChars;
    return (
      <span className="font-mono text-xs">
        {Array(filledChars).fill('▓').join('')}
        {Array(emptyChars).fill('▒').join('')}
      </span>
    );
  };

  if (!activeProjectId) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <PixelEmptyState
          icon={<DaemonMascot size="lg" state="idle" />}
          title="No project selected."
          description="Select a project from the sidebar to view specs."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[--text-primary]">Specifications</h1>
        <PixelButton tone="purple" onClick={() => router.push('/specs/new')}>
          + New Spec
        </PixelButton>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          {[
            {
              id: 'all',
              label: `ALL ${meta?.counts ? Object.values(meta.counts).reduce((a, b) => a + b, 0) : ''}`,
            },
            { id: 'drafting', label: `DRAFTING ${meta?.counts?.drafting || ''}` },
            { id: 'pending_approval', label: `REVIEW ${meta?.counts?.pending_approval || ''}` },
            { id: 'executing', label: `RUNNING ${meta?.counts?.executing || ''}` },
            { id: 'stalled', label: `STALLED ${meta?.counts?.stalled || ''}` },
            { id: 'completed', label: `DONE ${meta?.counts?.completed || ''}` },
          ].map((tab) => (
            <PixelButton
              key={tab.id}
              tone={activeFilter === tab.id ? 'purple' : 'neutral'}
              variant={activeFilter === tab.id ? 'solid' : 'ghost'}
              onClick={() => {
                setActiveFilter(tab.id);
                setPage(1);
              }}
            >
              {tab.label}
            </PixelButton>
          ))}
        </div>
        <div className="w-64">
          <PixelInput
            tone="purple"
            placeholder="Search specifications..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading && specs.length === 0 ? (
          <div className="flex flex-col gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-full bg-[--bg-elevated]" />
            ))}
          </div>
        ) : specs.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <PixelEmptyState
              icon={<DaemonMascot size="lg" state="idle" />}
              title="No specifications."
              description="Write what you want to build. I'll figure out the how."
              action={
                <PixelButton tone="purple" onClick={() => router.push('/specs/new')}>
                  Write First Spec
                </PixelButton>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-[--border-default] bg-[--bg-surface]">
            <table className="w-full text-left text-sm text-[--text-primary]">
              <thead className="border-b border-[--border-muted] bg-[--bg-elevated] text-xs font-medium tracking-wider text-[--text-secondary] uppercase">
                <tr>
                  <th className="px-4 py-3 font-mono">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Tasks</th>
                  <th className="px-4 py-3">Last Run</th>
                  <th className="w-12 px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--border-muted]">
                {specs.map((spec) => {
                  const isPulsing = spec.status === 'pending_plan' || spec.status === 'executing';
                  return (
                    <tr
                      key={spec.id}
                      className="group cursor-pointer hover:bg-[--bg-elevated]"
                      onClick={() => router.push(`/specs/${spec.id}`)}
                    >
                      <td className="px-4 py-3">
                        <code className="rounded-sm bg-[--phosphor-amber]/10 px-1 font-mono text-xs text-[--phosphor-amber]">
                          {spec.externalId || `SPEC-${String(spec.id).padStart(3, '0')}`}
                        </code>
                      </td>
                      <td className="px-4 py-3 font-medium">{spec.name}</td>
                      <td className="px-4 py-3">
                        <span className={isPulsing ? 'animate-pulse' : ''}>
                          <PixelBadge tone={getStatusBadgeTone(spec.status)}>
                            {getStatusBadgeLabel(spec.status)}
                          </PixelBadge>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[--text-muted]">
                        {spec.version || 'v1'}
                      </td>
                      <td className="px-4 py-3 text-[--text-muted]">
                        {renderProgressBar(spec.completedTasks || 0, spec.totalTasks || 0)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[--text-muted]">
                        {spec.lastRunRel || '-'}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <PixelDropdown
                            label="⋯"
                            items={[
                              { value: 'edit', label: 'Edit' },
                              { value: 'duplicate', label: 'Duplicate' },
                              { value: 'delete', label: 'Delete' },
                            ]}
                            onSelect={(value) => {
                              if (value === 'edit') {
                                router.push(`/specs/${spec.id}/edit`);
                              }
                              // TODO: handle duplicate/delete
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Placeholder */}
      {specs.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs text-[--text-muted]">
          <PixelButton
            tone="neutral"
            variant="ghost"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </PixelButton>
          <span className="font-mono">
            Page {page} of {meta?.total ? Math.ceil(meta.total / 10) : 1}
          </span>
          <PixelButton
            tone="neutral"
            variant="ghost"
            disabled={!meta || page >= Math.ceil(meta.total / 10)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </PixelButton>
        </div>
      )}
    </div>
  );
}
