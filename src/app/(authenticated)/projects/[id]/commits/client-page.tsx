'use client';

import { useState, useMemo } from 'react';
import { ProjectSelect, GitCommitSelect } from '@/db/schema';
import { AppShell } from '@/components/app-shell';
import { Tabs } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { GitBranch, User, Clock, CheckSquare, Layout, ArrowLeft, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectCommitsClientProps {
  projectId: number;
  project: ProjectSelect;
  projects: ProjectSelect[];
  commits: GitCommitSelect[];
}

export function ProjectCommitsClient({
  projectId,
  project,
  projects,
  commits,
}: ProjectCommitsClientProps) {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  const branches = useMemo(() => {
    const branchSet = new Set<string>();
    commits.forEach((commit) => {
      if (commit.branch) branchSet.add(commit.branch);
    });
    return ['all', ...Array.from(branchSet).sort()];
  }, [commits]);

  const filteredCommits = useMemo(() => {
    if (selectedBranch === 'all') return commits;
    return commits.filter((commit) => commit.branch === selectedBranch);
  }, [commits, selectedBranch]);

  const tabs = [
    { id: 'kanban', label: 'Kanban', href: `/projects/${projectId}` },
    { id: 'spec', label: 'Spec', href: `/projects/${projectId}?tab=spec` },
    { id: 'plan', label: 'Plan', href: `/projects/${projectId}?tab=plan` },
    { id: 'commits', label: 'Commits', href: `/projects/${projectId}/commits` },
    { id: 'test-results', label: 'Test Results', href: `/projects/${projectId}?tab=test-results` },
    { id: 'logs', label: 'Logs', href: `/projects/${projectId}?tab=logs` },
    { id: 'settings', label: 'Settings', href: `/projects/${projectId}/settings` },
  ];

  return (
    <AppShell sidebarProjects={projects} currentProjectId={projectId}>
      <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
        {/* Project Header */}
        <div className="px-[var(--sp-6)] pt-[var(--sp-6)] pb-[var(--sp-2)]">
          <div className="flex items-center gap-[var(--sp-2)] text-[12px] text-[var(--color-text-tertiary)] mb-[var(--sp-2)]">
            <a href="/" className="hover:text-[var(--color-brand-bold)] transition-colors">Projects</a>
            <span>/</span>
            <span className="text-[var(--color-text-secondary)]">{project.name}</span>
          </div>
          <div className="flex items-center justify-between mb-[var(--sp-6)]">
            <h1 className="text-[24px] font-semibold text-[var(--color-text-primary)] tracking-tight">Commits</h1>
          </div>

          <Tabs tabs={tabs} activeTab="commits" />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-[var(--sp-6)] py-[var(--sp-6)]">
          <div className="max-w-5xl">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-[var(--sp-4)] mb-[var(--sp-6)]">
              <div className="flex items-center gap-[var(--sp-4)]">
                <div className="relative group">
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="appearance-none bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] h-[32px] pl-3 pr-8 rounded-[var(--radius-sm)] text-[13px] font-medium text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-selected)] transition-all cursor-pointer hover:bg-[var(--color-bg-hovered)]"
                  >
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch === 'all' ? 'All Branches' : branch}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)]" />
                </div>
                <span className="text-[12px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                  {filteredCommits.length} commit{filteredCommits.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {commits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-[var(--sp-12)] border-2 border-dashed border-[var(--color-border-default)] rounded-[var(--radius-lg)] opacity-60">
                <GitBranch size={48} className="text-[var(--color-border-default)] mb-[var(--sp-4)]" />
                <h3 className="text-[18px] font-semibold text-[var(--color-text-primary)] mb-[var(--sp-2)]">No commits yet</h3>
                <p className="text-[14px] text-[var(--color-text-secondary)] mb-[var(--sp-6)]">Commits will appear here once the agent starts working.</p>
                <Button variant="primary" onClick={() => window.location.href = `/projects/${projectId}/settings`}>Configure Git Integration</Button>
              </div>
            ) : filteredCommits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-[var(--sp-12)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] opacity-60">
                <Search size={32} className="text-[var(--color-text-tertiary)] mb-[var(--sp-3)]" />
                <p className="text-[14px] text-[var(--color-text-secondary)] italic">No commits on "{selectedBranch}" branch.</p>
              </div>
            ) : (
              <div className="space-y-[var(--sp-3)]">
                {filteredCommits.map((commit) => (
                  <div
                    key={commit.id}
                    className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] p-[var(--sp-4)] hover:border-[var(--color-border-selected)] transition-all shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-start gap-[var(--sp-4)]">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] flex items-center justify-center shrink-0">
                        <GitBranch size={16} className="text-[var(--color-brand-bold)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-[15px] font-bold text-[var(--color-text-primary)] truncate flex-1 mr-4">{commit.message}</h4>
                          <span className="px-2 py-0.5 bg-[var(--color-bg-sunken)] text-[var(--color-text-tertiary)] rounded-[var(--radius-sm)] text-[10px] font-mono border border-[var(--color-border-default)]">
                            {commit.commitSha?.substring(0, 7)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-[var(--sp-4)] gap-y-[var(--sp-1)] text-[12px] font-medium text-[var(--color-text-tertiary)] mb-3">
                          <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-[var(--status-inprogress-bg)] text-[var(--status-inprogress-text)] rounded-[var(--radius-sm)] font-bold text-[10px] uppercase">
                            <GitBranch size={10} />
                            {commit.branch}
                          </div>
                          {commit.author && (
                            <div className="flex items-center gap-1.5">
                              <User size={12} />
                              <span>{commit.author}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} />
                            <span>{new Date(commit.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-[var(--sp-2)]">
                          {commit.taskId && (
                            <Button variant="secondary" size="small" onClick={() => window.location.href = `/projects/${projectId}?tab=kanban`} icon={<CheckSquare size={12} />}>
                              Task SD-{commit.taskId}
                            </Button>
                          )}
                          {commit.planId && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-[var(--color-bg-sunken)] rounded-[var(--radius-sm)] text-[11px] font-bold text-[var(--color-text-tertiary)]">
                              <Layout size={12} />
                              Plan #{commit.planId}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
