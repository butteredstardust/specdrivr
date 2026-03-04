'use client';

import { useState } from 'react';
import { ProjectSelect } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { ProjectSidebarWrapper } from '@/components/project-sidebar-wrapper';
import { InlineConstitutionEditor } from '@/components/inline-constitution-editor';
import { InlineTechStackEditor } from '@/components/inline-tech-stack-editor';
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
  const [projectNameInput, setProjectNameInput] = useState(project.name);

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

  const handleArchive = async () => {
    // TODO: Implement archive functionality
    console.log('Archiving project:', projectId);
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

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <label className="ios-callout block text-ios-text-secondary mb-2">
                    Repository URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://github.com/org/repo"
                      className="ios-input"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="ios-callout block text-ios-text-secondary mb-2">
                      Default Branch
                    </label>
                    <select className="ios-select">
                      <option>main</option>
                      <option>master</option>
                      <option>develop</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Agent Tokens Section */}
              <section className="ios-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="ios-title-3 text-ios-text-primary ios-font-display">
                    Agent Tokens
                  </h2>
                  <Button variant="secondary" size="small">
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

                <p className="ios-body text-ios-text-secondary mb-4">
                  Archiving a project will hide it from the dashboard but preserve all data.
                </p>

                <Button
                  variant="danger"
                  size="small"
                  onClick={() => setShowArchiveConfirm(true)}
                >
                  Archive Project
                </Button>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={handleArchive}
        title="Archive Project?"
        message="This will archive the project and hide it from the dashboard. You can unarchive it later from settings."
        confirmText="Archive"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
