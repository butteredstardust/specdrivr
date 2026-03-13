'use client';

import React, { useEffect, useState } from 'react';
import { clientLogger } from '@/lib/logger-client';
import { PixelBadge, PixelDropdown, PixelEmptyState, PixelButton } from '@pxlkit/ui-kit';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { useRouter } from 'next/navigation';
import { useShell } from '@/components/providers/shell-provider';
import { NewProjectDialog } from '@/components/projects/new-project-dialog';

export default function ProjectsPage() {
  const router = useRouter();
  const { setActiveProjectId } = useShell();
  const [projects, setProjects] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/projects', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.data || []);
        setIsLoading(false);
      })
      .catch((err) => {
        clientLogger.error('Failed to fetch projects', err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <DaemonMascot size="lg" state="thinking" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[--text-primary]">Projects</h1>
        <NewProjectDialog>
          <PixelButton tone="purple">+ New Project</PixelButton>
        </NewProjectDialog>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <PixelEmptyState
            icon={<DaemonMascot size="lg" state="idle" />}
            title="No projects yet."
            description="Point me at a repository and I'll get to work."
            action={
              <NewProjectDialog>
                <PixelButton tone="purple">Initialize First Project</PixelButton>
              </NewProjectDialog>
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-[--border-default] bg-[--bg-surface]">
          {/* pxlkit fallback: PixelTable does not support custom cell renderers */}
          <table className="w-full text-left text-sm text-[--text-primary]">
            <thead className="border-b border-[--border-muted] bg-[--bg-elevated] text-xs font-medium tracking-wider text-[--text-secondary] uppercase">
              <tr>
                <th className="px-4 py-3 font-mono">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Repository</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Status</th>
                <th className="w-12 px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[--border-muted]">
              {projects.map((project) => {
                const extId = `PROJ-${String(project.id).padStart(3, '0')}`;

                let repoDisplay = project.repositoryUrl || '-';
                if (repoDisplay.includes('github.com/')) {
                  repoDisplay = repoDisplay.split('github.com/')[1];
                }

                return (
                  <tr
                    key={project.id}
                    className="group cursor-pointer hover:bg-[--bg-elevated]"
                    onClick={() => {
                      setActiveProjectId(project.id);
                      router.push('/specs');
                    }}
                  >
                    <td className="px-4 py-3">
                      <code className="rounded-sm bg-[--phosphor-amber]/10 px-1 font-mono text-xs text-[--phosphor-amber]">
                        {extId}
                      </code>
                    </td>
                    <td className="px-4 py-3 font-medium">{project.name}</td>
                    <td className="px-4 py-3 font-mono text-[--text-muted]">{repoDisplay}</td>
                    <td className="px-4 py-3 font-mono text-[--text-muted]">
                      {project.repositoryBranch || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <PixelBadge tone={project.status === 'active' ? 'green' : 'neutral'}>
                        {project.status}
                      </PixelBadge>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <PixelDropdown
                          label="⋯"
                          items={[
                            { value: 'settings', label: 'Settings' },
                            { value: 'archive', label: 'Archive' },
                            { value: 'delete', label: 'Delete' },
                          ]}
                          onSelect={(value) => {
                            if (value === 'settings') {
                              router.push(`/projects/${project.id}/settings`);
                            }
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
  );
}
