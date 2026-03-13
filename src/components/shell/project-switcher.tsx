'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PixelDropdown, PixelEmptyState, PxlKitButton } from '@pxlkit/ui-kit';
import { PxlKitIcon } from '@pxlkit/core';
import { Check } from '@pxlkit/ui';
import { useShell } from '@/components/providers/shell-provider';
import { clientLogger } from '@/lib/logger-client';

type Project = {
  id: string;
  name: string;
  slug: string;
};

export function ProjectSwitcher() {
  const router = useRouter();
  const { activeProjectId, setActiveProjectId } = useShell();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/v1/projects', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          // Adjust based on the actual API envelope returned by backend
          const projectList = Array.isArray(data) ? data : data.data || [];
          setProjects(projectList);

          if (!activeProjectId && projectList.length > 0) {
            setActiveProjectId(projectList[0].id);
          }
        }
      } catch (err) {
        clientLogger.error('Failed to fetch projects', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, [activeProjectId]);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  if (loading) {
    return <div className="h-8 w-40 animate-pulse rounded bg-[--bg-elevated]" />;
  }

  if (projects.length === 0) {
    return (
      <div className="p-2">
        <PixelEmptyState
          title="No projects"
          description="You don't have any projects yet."
          action={
            <PxlKitButton
              label="Initialize →"
              tone="purple"
              icon={<PxlKitIcon icon={Check} size={16} />}
              onClick={() => router.push('/projects')}
            ></PxlKitButton>
          }
        />
      </div>
    );
  }

  // pxlkit fallback: Using custom label string prefix since PixelDropdown might not support ReactNode items
  const items = [
    ...projects.map((p) => ({
      value: p.id,
      label: p.id === activeProjectId ? `✓ ${p.name}` : `  ${p.name}`,
    })),
    { value: '__divider__', label: '---' }, // fallback if PixelDivider not natively supported in array
    { value: '__manage__', label: 'Manage projects →' },
  ];

  return (
    <PixelDropdown
      label={`~/${activeProject?.slug ?? '...'}/... ∨`}
      items={items}
      onSelect={(value) => {
        if (value === '__divider__') return;
        if (value === '__manage__') {
          router.push('/projects');
          return;
        }
        setActiveProjectId(value);
        router.push('/');
      }}
    />
  );
}
