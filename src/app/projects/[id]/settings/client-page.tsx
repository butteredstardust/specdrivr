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
  const [repoUrl, setRepoUrl] = useState(project.basePath || '');
  const [gitBranch, setGitBranch] = useState(project.gitBranch as string || 'main');
  const [gitStrategy, setGitStrategy] = useState(project.gitStrategy as string || 'merge');
  const [isSavingGitConfig, setIsSavingGitConfig] = useState(false);
  const [gitConfigMessage, setGitConfigMessage] = useState<string | null>(null);

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
    <div className="min-h-screen bg-ios-bg-primary ios-font-text">
      {/* Header */}
      <header className="sticky top-0 z-30 ios-header border-b border-ios-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <a
                  href="/"
                  className="ios-callout text-ios-blue hover:text-ios-blue-dark transition-colors"
                >
                  ← Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <aside className="w-60 flex-shrink-0 border-r border-ios-border bg-ios-bg-card ios-scrollbar overflow-y-auto">
          <ProjectSidebarWrapper
            projects={projects}
            currentProjectId={projectId}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto ios-scrollbar bg-ios-bg-primary">
          {/* Project Title Section */}
          <div className="px-6 py-4 bg-ios-bg-card border-b border-ios-border">
            <h1 className="ios-title-1 text-ios-text-primary ios-font-display">
              {project.name}
            </h1>
          </div>

          {/* Settings Tabs */}
          <div className="border-b border-ios-border bg-ios-bg-card sticky top-0 z-10">
            <nav className="flex space-x-0 ios-scrollbar overflow-x-auto max-w-6xl mx-auto">
              {tabs.map((tab) => (
                <a
                  key={tab.id}
                  href={tab.href}
                  className={`
                    relative flex items-center gap-2 px-4 py-3 ios-body font-medium transition-colors whitespace-nowrap
                    ${tab.id === 'settings'
                      ? 'text-ios-blue border-b-2 border-ios-blue'
                      : 'text-ios-text-secondary hover:text-ios-text-primary border-b-2 border-transparent'
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
              <section className="ios-card p-6">
                <h2 className="ios-title-3 text-ios-text-primary mb-4 ios-font-display">
                  General
                </h2>

                <div className="space-y-4">
                  {/* Project Name */}
                  <div>
                    <label className="ios-callout block text-ios-text-secondary mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={projectNameInput}
                      onChange={(e) => setProjectNameInput(e.target.value)}
                      className="ios-input"
                    />
                  </div>

                  {/* Constitution */}
                  <div>
                    <label className="ios-callout block text-ios-text-secondary mb-2">
                      Constitution
                    </label>
                    <InlineConstitutionEditor
                      projectId={projectId}
                      constitution={project.constitution as string | null}
                    />
                  </div>

                  {/* Tech Stack */}
                  <div>
                    <label className="ios-callout block text-ios-text-secondary mb-2">
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
              <section className="ios-card p-6">
                <h2 className="ios-title-3 text-ios-text-primary mb-4 ios-font-display">
                  Git Integration
                </h2>

                <p className="ios-body text-ios-text-secondary mb-4">
                  Connect a repository to track agent commits automatically.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="ios-callout block text-ios-text-secondary mb-2">
                      Repository URL
                    </label>
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/org/repo"
                      className="ios-input"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="ios-callout block text-ios-text-secondary mb-2">
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
                      <label className="ios-callout block text-ios-text-secondary mb-2">
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
                        <span className={`ios-caption-1 ${gitConfigMessage.includes('saved') ? 'text-ios-green' : 'text-ios-red'}`}>
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
              <section className="ios-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="ios-title-3 text-ios-text-primary ios-font-display">
                    Agent Tokens
                  </h2>
                  <Button variant="secondary" size="small" onClick={() => setShowTokenDialog(true)}>
                    + Generate New Token
                  </Button>
                </div>

                <div className="text-center py-8 bg-ios-secondary rounded-ios-lg border border-ios-border">
                  <p className="ios-body text-ios-text-secondary">
                    No agent tokens configured yet.
                  </p>
                  <p className="ios-caption-1 text-ios-placeholder mt-2">
                    Generate a token to allow agents to access this project.
                  </p>
                </div>
              </section>

              {/* Danger Zone */}
              <section className="ios-card p-6 border-2 border-ios-red">
                <h2 className="ios-title-3 text-ios-red mb-4 ios-font-display">
                  Danger Zone
                </h2>

                {archiveMessage && (
                  <div className="mb-4 p-3 rounded-md"
                    style={{
                      backgroundColor: archiveMessage.includes('success') ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 69, 58, 0.1)',
                      borderColor: 'var(--ios-separator)',
                    }}>
                    <p className={`ios-caption-1 ${archiveMessage.includes('success') ? 'text-ios-green' : 'text-ios-red'}`}>
                      {archiveMessage}
                    </p>
                  </div>
                )}

                <p className="ios-body text-ios-text-secondary mb-4">
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
        </main>
      </div>

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

      {/* Archive confirmation state */}
      <input
        type="hidden"
        value={projectNameInput}
        onChange={(e) => setProjectNameInput(e.target.value)}
      />

      {/* Generate Token Dialog */}
      <GenerateTokenDialog
        isOpen={showTokenDialog}
        onClose={() => setShowTokenDialog(false)}
      />
    </div>
  );
}
