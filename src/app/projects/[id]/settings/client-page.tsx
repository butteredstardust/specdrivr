'use client';

import { useState } from 'react';
import { ProjectSelect } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { ProjectSidebarWrapper } from '@/components/project-sidebar-wrapper';
import { InlineConstitutionEditor } from '@/components/inline-constitution-editor';
import { InlineTechStackEditor } from '@/components/inline-tech-stack-editor';
import { GenerateTokenDialog } from '@/components/generate-token-dialog';
import { ArchiveProjectDialog } from '@/components/archive-project-dialog';
import { updateGitConfigDev as updateGitConfig, archiveProjectDev } from '@/lib/actions';
import type { TabData } from '@/components/ui/tabs';

interface ProjectSettingsClientProps {
  projectId: number;
  project: ProjectSelect;
  projects: ProjectSelect[];
}

export function ProjectSettingsClient({
  projectId,
  project,
  projects,
}: ProjectSettingsClientProps) {
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState(project.name);
  const [projectDescriptionInput, setProjectDescriptionInput] = useState(project.description || '');
  const [projectMissionInput, setProjectMissionInput] = useState(project.mission || '');
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [detailsMessage, setDetailsMessage] = useState<string | null>(null);

  const [repoUrl, setRepoUrl] = useState(project.basePath || '');
  const [gitBranch, setGitBranch] = useState(project.gitBranch as string || 'main');
  const [gitStrategy, setGitStrategy] = useState(project.gitStrategy as string || 'merge');
  const [isSavingGitConfig, setIsSavingGitConfig] = useState(false);
  const [gitConfigMessage, setGitConfigMessage] = useState<string | null>(null);

  const handleSaveDetails = async () => {
    setIsSavingDetails(true);
    setDetailsMessage(null);
    try {
      const { updateProjectDetailsDev } = await import('@/lib/actions');
      const result = await updateProjectDetailsDev(projectId, {
        name: projectNameInput,
        description: projectDescriptionInput,
        mission: projectMissionInput
      });
      if (result.success) {
        setDetailsMessage('Project details saved successfully');
      } else {
        setDetailsMessage(result.error || 'Failed to save details');
      }
    } catch (e) {
      setDetailsMessage('An unexpected error occurred');
    } finally {
      setIsSavingDetails(false);
      setTimeout(() => setDetailsMessage(null), 3000);
    }
  };

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

  // Extract tech stack
  const techStack = Array.isArray(project.techStack)
    ? (project.techStack as string[])
    : typeof project.techStack === 'string'
      ? [project.techStack]
      : [];

  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveMessage, setArchiveMessage] = useState<string | null>(null);

  const handleArchive = async () => {
    setIsArchiving(true);
    setArchiveMessage(null);

    try {
      const result = await archiveProjectDev(projectId, project.status === 'archived');

      if (result.success) {
        setArchiveMessage(result.message || 'Operation completed');
        setShowArchiveConfirm(false);
        setProjectNameInput('');
        // Clear message after 3 seconds
        setTimeout(() => setArchiveMessage(null), 3000);
      } else {
        setArchiveMessage(result.error || 'Failed to update project');
      }
    } catch (error) {
      setArchiveMessage('An unexpected error occurred');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleSaveGitConfig = async () => {
    setIsSavingGitConfig(true);
    setGitConfigMessage(null);

    try {
      const result = await updateGitConfig(projectId, {
        basePath: repoUrl,
        gitBranch,
        gitStrategy,
      });

      if (result.success) {
        setGitConfigMessage('Git configuration saved successfully');
      } else {
        setGitConfigMessage(result.error || 'Failed to save git configuration');
      }
    } catch (error) {
      setGitConfigMessage('An unexpected error occurred');
    } finally {
      setIsSavingGitConfig(false);
      // Clear message after 3 seconds
      setTimeout(() => setGitConfigMessage(null), 3000);
    }
  };

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
            <span className="truncate">{project.name}</span>
          </div>
          <div className="flex items-center gap-[8px]"></div>
        </header>

        <div className="flex-1 overflow-y-auto bg-bg-primary">

          {/* Settings Tabs */}
          <div className="border-b border-border-default bg-bg-elevated sticky top-0 z-10">
            <nav className="flex space-x-0 linear-scrollbar overflow-x-auto max-w-6xl mx-auto">
              {tabs.map((tab) => (
                <a
                  key={tab.id}
                  href={tab.href}
                  className={`
                    relative flex items-center gap-2 px-4 py-3 text-[13px] font-medium transition-colors whitespace-nowrap
                    ${tab.id === 'settings'
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

          {/* Settings Content */}
          <div className="px-6 py-6">
            <div className="max-w-3xl space-y-6">
              {/* General Section */}
              <section className="bg-bg-elevated border border-border-default rounded-[8px] p-6">
                <h2 className="text-[16px] font-semibold text-text-primary mb-4 ">
                  General
                </h2>

                <div className="space-y-4">
                  {/* Project Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[13px] font-medium block text-text-secondary mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={projectNameInput}
                        onChange={(e) => setProjectNameInput(e.target.value)}
                        className="h-[30px] bg-bg-elevated border border-border-default rounded-[6px] text-text-primary text-[12px] px-[10px] outline-none focus:border-border-strong placeholder:text-text-tertiary transition-colors w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[13px] font-medium block text-text-secondary mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={projectDescriptionInput}
                        onChange={(e) => setProjectDescriptionInput(e.target.value)}
                        placeholder="A brief summary of what this project is"
                        className="h-[30px] bg-bg-elevated border border-border-default rounded-[6px] text-text-primary text-[12px] px-[10px] outline-none focus:border-border-strong placeholder:text-text-tertiary transition-colors w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[13px] font-medium block text-text-secondary mb-2">
                        Mission
                      </label>
                      <textarea
                        value={projectMissionInput}
                        onChange={(e) => setProjectMissionInput(e.target.value)}
                        placeholder="The core goal or purpose of the project"
                        className="h-[30px] bg-bg-elevated border border-border-default rounded-[6px] text-text-primary text-[12px] px-[10px] outline-none focus:border-border-strong placeholder:text-text-tertiary transition-colors w-full min-h-[80px]"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        {detailsMessage && (
                          <span className={`text-[11px] ${detailsMessage.includes('saved') ? 'text-status-success' : 'text-status-error'}`}>
                            {detailsMessage}
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={handleSaveDetails}
                        disabled={isSavingDetails}
                        variant="secondary"
                      >
                        {isSavingDetails ? 'Saving...' : 'Save Details'}
                      </Button>
                    </div>
                  </div>

                  {/* Constitution */}
                  <div>
                    <label className="text-[13px] font-medium block text-text-secondary mb-2">
                      Constitution
                    </label>
                    <InlineConstitutionEditor
                      projectId={projectId}
                      constitution={project.constitution as string | null}
                    />
                  </div>

                  {/* Tech Stack */}
                  <div>
                    <label className="text-[13px] font-medium block text-text-secondary mb-2">
                      Tech Stack
                    </label>
                    <InlineTechStackEditor
                      projectId={projectId}
                      techStack={project.techStack as Record<string, unknown> || {}}
                    />
                  </div>
                </div>
              </section>

              {/* Git Integration Section */}
              <section className="bg-bg-elevated border border-border-default rounded-[8px] p-6">
                <h2 className="text-[16px] font-semibold text-text-primary mb-4 ">
                  Git Integration
                </h2>

                <p className="text-[13px] text-text-secondary mb-4">
                  Connect a repository to track agent commits automatically.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-[13px] font-medium block text-text-secondary mb-2">
                      Repository URL
                    </label>
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/org/repo"
                      className="h-[30px] bg-bg-elevated border border-border-default rounded-[6px] text-text-primary text-[12px] px-[10px] outline-none focus:border-border-strong placeholder:text-text-tertiary transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-[13px] font-medium block text-text-secondary mb-2">
                        Default Branch
                      </label>
                      <select
                        value={gitBranch}
                        onChange={(e) => setGitBranch(e.target.value)}
                        className="ios-select"
                      >
                        <option value="main">main</option>
                        <option value="master">master</option>
                        <option value="develop">develop</option>
                        <option value="staging">staging</option>
                      </select>
                    </div>

                    <div className="flex-1">
                      <label className="text-[13px] font-medium block text-text-secondary mb-2">
                        Merge Strategy
                      </label>
                      <select
                        value={gitStrategy}
                        onChange={(e) => setGitStrategy(e.target.value)}
                        className="ios-select"
                      >
                        <option value="merge">Merge</option>
                        <option value="rebase">Rebase</option>
                        <option value="squash">Squash</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      {gitConfigMessage && (
                        <span className={`text-[11px] ${gitConfigMessage.includes('saved') ? 'text-status-success' : 'text-status-error'}`}>
                          {gitConfigMessage}
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={handleSaveGitConfig}
                      disabled={isSavingGitConfig}
                      variant="secondary"
                    >
                      {isSavingGitConfig ? 'Saving...' : 'Save Git Config'}
                    </Button>
                  </div>
                </div>
              </section>

              {/* Agent Tokens Section */}
              <section className="bg-bg-elevated border border-border-default rounded-[8px] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[16px] font-semibold text-text-primary ">
                    Agent Tokens
                  </h2>
                  <Button variant="secondary" size="small" onClick={() => setShowTokenDialog(true)}>
                    + Generate New Token
                  </Button>
                </div>

                <div className="text-center py-8 bg-ios-secondary rounded-ios-lg border border-border-default">
                  <p className="text-[13px] text-text-secondary">
                    No agent tokens configured yet.
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-2">
                    Generate a token to allow agents to access this project.
                  </p>
                </div>
              </section>

              {/* Danger Zone */}
              <section className="bg-bg-elevated border border-border-default rounded-[8px] p-6 border-2 border-status-error">
                <h2 className="text-[16px] font-semibold text-status-error mb-4 ">
                  Danger Zone
                </h2>

                {archiveMessage && (
                  <div className="mb-4 p-3 rounded-md"
                    style={{
                      backgroundColor: archiveMessage.includes('success') ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 69, 58, 0.1)',
                      borderColor: 'var(--ios-separator)',
                    }}>
                    <p className={`text-[11px] ${archiveMessage.includes('success') ? 'text-status-success' : 'text-status-error'}`}>
                      {archiveMessage}
                    </p>
                  </div>
                )}

                <p className="text-[13px] text-text-secondary mb-4">
                  {project.status === 'archived'
                    ? 'This project is currently archived and hidden from the dashboard.'
                    : 'Archiving a project will hide it from the dashboard but preserve all data.'}
                </p>

                <Button
                  variant={project.status === 'archived' ? "secondary" : "danger"}
                  size="small"
                  onClick={() => setShowArchiveConfirm(true)}
                  disabled={isArchiving}
                >
                  {isArchiving ? 'Processing...' : (project.status === 'archived' ? 'Unarchive Project' : 'Archive Project')}
                </Button>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Archive/Unarchive Confirmation Dialog */}
      <ArchiveProjectDialog
        isOpen={showArchiveConfirm}
        onClose={() => {
          setShowArchiveConfirm(false);
          setProjectNameInput('');
        }}
        onConfirm={handleArchive}
        projectName={project.name}
        isArchived={project.status === 'archived'}
      />

      {/* Generate Token Dialog */}
      <GenerateTokenDialog
        isOpen={showTokenDialog}
        onClose={() => setShowTokenDialog(false)}
      />
    </div>
  );
}
