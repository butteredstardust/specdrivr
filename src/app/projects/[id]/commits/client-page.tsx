'use client';

import { useState, useMemo } from 'react';
import { ProjectSelect, GitCommitSelect } from '@/db/schema';
import { ProjectSidebarWrapper } from '@/components/project-sidebar-wrapper';
import type { TabData } from '@/components/ui/tabs';

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

  // Get unique branches from commits
  const branches = useMemo(() => {
    const branchSet = new Set<string>();
    commits.forEach((commit) => {
      if (commit.branch) branchSet.add(commit.branch);
    });
    return ['all', ...Array.from(branchSet).sort()];
  }, [commits]);

  // Filter commits by branch
  const filteredCommits = useMemo(() => {
    if (selectedBranch === 'all') {
      return commits;
    }
    return commits.filter((commit) => commit.branch === selectedBranch);
  }, [commits, selectedBranch]);
  const tabs: TabData[] = [
    {
      id: 'kanban',
      label: 'Kanban',
      href: `/projects/${projectId}`,
    },
    {
      id: 'spec',
      label: 'Spec',
      href: `/projects/${projectId}?tab=spec`,
    },
    {
      id: 'plan',
      label: 'Plan',
      href: `/projects/${projectId}?tab=plan`,
    },
    {
      id: 'commits',
      label: 'Commits',
      href: `/projects/${projectId}/commits`,
    },
    {
      id: 'test-results',
      label: 'Test Results',
      href: `/projects/${projectId}?tab=test-results`,
    },
    {
      id: 'logs',
      label: 'Logs',
      href: `/projects/${projectId}?tab=logs`,
    },
    {
      id: 'settings',
      label: 'Settings',
      href: `/projects/${projectId}/settings`,
    },
  ];

  return (
    <div className="flex h-screen w-full bg-bg-primary overflow-hidden text-text-primary">
      <aside className="hidden md:flex flex-col h-full shrink-0">
        <ProjectSidebarWrapper
          projects={projects}
          currentProjectId={projectId}
        />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-full bg-bg-primary">
        <header className="h-[48px] border-b border-border-subtle flex items-center justify-between px-[24px] shrink-0 bg-bg-primary">
          <div className="text-[13px] font-semibold text-text-primary flex items-center gap-2 max-w-[60%]">
            <a
              href="/"
              className="text-text-secondary hover:text-text-primary transition-colors inline-flex"
            >
              ←
            </a>
            <span className="truncate">{project.name} Commits</span>
          </div>
          <div className="flex items-center gap-[8px]"></div>
        </header>

        <div className="flex-1 overflow-y-auto bg-bg-primary">

          {/* Tabs */}
          <div className="border-b border-border-default bg-bg-elevated sticky top-0 z-10">
            <nav className="flex space-x-0 linear-scrollbar overflow-x-auto max-w-6xl mx-auto">
              {tabs.map((tab) => (
                <a
                  key={tab.id}
                  href={tab.href}
                  className={`
                    relative flex items-center gap-2 px-4 py-3 text-[13px] font-medium transition-colors whitespace-nowrap
                    ${tab.id === 'commits'
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-text-secondary hover:text-text-primary border-b-2 border-transparent'
                    }
                  `}
                >
                  {tab.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Commits Content */}
          <div className="px-6 py-6">
            <div className="max-w-4xl">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[13px] font-medium block text-text-secondary mb-2">
                    Branch
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="ios-select text-[11px]"
                  >
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch === 'all' ? 'All Branches' : branch}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <span className="text-[11px] text-text-secondary ">
                    {filteredCommits.length} commit{filteredCommits.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Empty State - No commits */}
              {commits.length === 0 ? (
                <div className="bg-bg-elevated border border-border-default rounded-[8px] p-8 text-center">
                  <div className="mb-4 flex justify-center">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-text-tertiary"
                    >
                      <line x1="6" y1="3" x2="6" y2="15" />
                      <circle cx="18" cy="6" r="3" />
                      <path d="M6 9a9 9 0 0 1 9 9" />
                    </svg>
                  </div>
                  <h3 className="text-[16px] font-semibold text-text-primary mb-2 ">
                    No commits yet
                  </h3>
                  <p className="text-[13px] text-text-secondary mb-4">
                    Commits will appear here as the agent makes changes.
                  </p>
                  <a
                    href={`/projects/${projectId}/settings`}
                    className="inline-flex items-center gap-2 text-accent hover:text-accent-dark text-[13px] font-medium"
                  >
                    Configure Git →
                  </a>
                </div>
              ) : filteredCommits.length === 0 ? (
                <div className="bg-bg-elevated border border-border-default rounded-[8px] p-8 text-center">
                  <h3 className="text-[16px] font-semibold text-text-primary mb-2 ">
                    No commits on this branch
                  </h3>
                  <p className="text-[13px] text-text-secondary">
                    Select "All Branches" to see commits from other branches.
                  </p>
                </div>
              ) : (
                /* Commit Cards */
                <div className="space-y-3">
                  {filteredCommits.map((commit) => (
                    <div
                      key={commit.id}
                      className="bg-bg-elevated border border-border-default rounded-[8px] p-4 hover:shadow-md transition-shadow ios"
                    >
                      <div className="flex items-start gap-4">
                        {/* Commit Icon */}
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="text-accent"
                            >
                              <line x1="6" y1="3" x2="6" y2="15" />
                              <circle cx="18" cy="6" r="3" />
                              <path d="M6 9a9 9 0 0 1 9 9" />
                            </svg>
                          </div>
                        </div>

                        {/* Commit Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 mb-2">
                            <h4 className="text-[16px] font-semibold text-text-primary  break-words flex-1">
                              {commit.message}
                            </h4>
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent  whitespace-nowrap"
                            >
                              {commit.branch}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
                            <span className="text-[11px] text-text-secondary  font-mono">
                              {commit.sha}
                            </span>
                            {commit.authorName && (
                              <span className="text-[11px] text-text-secondary ">
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="inline-block mr-1"
                                >
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                                {commit.authorName}
                              </span>
                            )}
                            <span className="text-[11px] text-text-tertiary ">
                              {new Date(commit.timestamp).toLocaleString()}
                            </span>
                          </div>

                          {/* Associated Task & Plan Links */}
                          <div className="flex items-center gap-3">
                            {commit.taskId && (
                              <a
                                href={`/projects/${projectId}?tab=kanban`}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-status-idle-5 text-text-secondary text-[11px] hover:bg-status-idle-10 transition-colors "
                              >
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M9 11l3 3L22 4" />
                                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                </svg>
                                Task #{commit.taskId}
                              </a>
                            )}
                            {commit.planId && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-status-idle-5 text-text-secondary text-[11px] ">
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <path d="M9 3v18" />
                                  <path d="M15 9h6" />
                                </svg>
                                Plan {commit.planId}
                              </span>
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
      </main>
    </div>
  );
}
