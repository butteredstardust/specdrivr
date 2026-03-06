'use client';

import { useState } from 'react';
import { ProjectSelect } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { InlineConstitutionEditor } from '@/components/inline-constitution-editor';
import { InlineTechStackEditor } from '@/components/inline-tech-stack-editor';
import { GenerateTokenDialog } from '@/components/generate-token-dialog';
import { ArchiveProjectDialog } from '@/components/archive-project-dialog';
import { updateGitConfigDev as updateGitConfig, archiveProjectDev } from '@/lib/actions';
import {
  Settings,
  GitBranch,
  Key,
  AlertTriangle,
  Save,
  ChevronDown,
  Globe,
  Database,
  ShieldAlert,
  Archive,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [detailsMessage, setDetailsMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const [repoUrl, setRepoUrl] = useState(project.basePath || '');
  const [gitBranch, setGitBranch] = useState(project.gitBranch as string || 'main');
  const [gitStrategy, setGitStrategy] = useState(project.gitStrategy as string || 'merge');
  const [isSavingGitConfig, setIsSavingGitConfig] = useState(false);
  const [gitConfigMessage, setGitConfigMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveMessage, setArchiveMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

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
        setDetailsMessage({ text: 'Project details saved successfully', type: 'success' });
      } else {
        setDetailsMessage({ text: result.error || 'Failed to save details', type: 'error' });
      }
    } catch (e) {
      setDetailsMessage({ text: 'An unexpected error occurred', type: 'error' });
    } finally {
      setIsSavingDetails(false);
      setTimeout(() => setDetailsMessage(null), 3000);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    setArchiveMessage(null);
    try {
      const result = await archiveProjectDev(projectId, project.status === 'archived');
      if (result.success) {
        setArchiveMessage({ text: result.message || 'Operation completed', type: 'success' });
        setShowArchiveConfirm(false);
      } else {
        setArchiveMessage({ text: result.error || 'Failed to update project', type: 'error' });
      }
    } catch (error) {
      setArchiveMessage({ text: 'An unexpected error occurred', type: 'error' });
    } finally {
      setIsArchiving(false);
      setTimeout(() => setArchiveMessage(null), 3000);
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
        setGitConfigMessage({ text: 'Git configuration saved successfully', type: 'success' });
      } else {
        setGitConfigMessage({ text: result.error || 'Failed to save git configuration', type: 'error' });
      }
    } catch (error) {
      setGitConfigMessage({ text: 'An unexpected error occurred', type: 'error' });
    } finally {
      setIsSavingGitConfig(false);
      setTimeout(() => setGitConfigMessage(null), 3000);
    }
  };

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
    <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
      {/* Project Header */}
      <div className="px-[var(--sp-6)] pt-[var(--sp-6)] pb-[var(--sp-2)]">
        <div className="flex items-center gap-[var(--sp-2)] text-[12px] text-[var(--color-text-tertiary)] mb-[var(--sp-2)]">
          <a href="/" className="hover:text-[var(--color-brand-bold)] transition-colors">Projects</a>
          <span>/</span>
          <span className="text-[var(--color-text-secondary)]">{project.name}</span>
        </div>
        <div className="flex items-center justify-between mb-[var(--sp-6)]">
          <h1 className="text-[24px] font-semibold text-[var(--color-text-primary)] tracking-tight">Project Settings</h1>
        </div>

        <Tabs tabs={tabs} activeTab="settings" />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-[var(--sp-6)] py-[var(--sp-8)]">
        <div className="max-w-4xl space-y-[var(--sp-10)]">
          {/* General Settings */}
          <section className="space-y-[var(--sp-6)]">
            <div className="flex items-center gap-[var(--sp-3)] border-b border-[var(--color-border-default)] pb-[var(--sp-3)]">
              <Globe size={18} className="text-[var(--color-brand-bold)]" />
              <h2 className="text-[14px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">General Details</h2>
            </div>

            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] p-[var(--sp-6)] shadow-[var(--shadow-card)] space-y-[var(--sp-6)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--sp-6)]">
                <div className="space-y-[var(--sp-2)]">
                  <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Project Name</label>
                  <input
                    type="text"
                    value={projectNameInput}
                    onChange={(e) => setProjectNameInput(e.target.value)}
                    className="w-full h-[40px] px-[var(--sp-3)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[14px] focus:outline-none focus:border-[var(--color-border-selected)] transition-all"
                  />
                </div>
                <div className="space-y-[var(--sp-2)]">
                  <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Short Description</label>
                  <input
                    type="text"
                    value={projectDescriptionInput}
                    onChange={(e) => setProjectDescriptionInput(e.target.value)}
                    className="w-full h-[40px] px-[var(--sp-3)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[14px] focus:outline-none focus:border-[var(--color-border-selected)] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-[var(--sp-2)]">
                <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Core Mission</label>
                <textarea
                  value={projectMissionInput}
                  onChange={(e) => setProjectMissionInput(e.target.value)}
                  rows={3}
                  className="w-full p-[var(--sp-3)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[14px] focus:outline-none focus:border-[var(--color-border-selected)] transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-[var(--sp-2)]">
                <div>
                  {detailsMessage && (
                    <span className={cn("text-[12px] font-medium", detailsMessage.type === 'success' ? "text-[var(--status-success-text)]" : "text-[var(--color-text-danger)]")}>
                      {detailsMessage.text}
                    </span>
                  )}
                </div>
                <Button variant="primary" onClick={handleSaveDetails} loading={isSavingDetails} icon={<Save size={14} />}>
                  Save Details
                </Button>
              </div>
            </div>
          </section>

          {/* Constitution & Tech Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--sp-10)]">
            <section className="space-y-[var(--sp-6)]">
              <div className="flex items-center gap-[var(--sp-3)] border-b border-[var(--color-border-default)] pb-[var(--sp-3)]">
                <ShieldAlert size={18} className="text-[var(--color-brand-bold)]" />
                <h2 className="text-[14px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Constitution</h2>
              </div>
              <InlineConstitutionEditor
                projectId={projectId}
                constitution={project.constitution as string | null}
              />
            </section>

            <section className="space-y-[var(--sp-6)]">
              <div className="flex items-center gap-[var(--sp-3)] border-b border-[var(--color-border-default)] pb-[var(--sp-3)]">
                <Database size={18} className="text-[var(--color-brand-bold)]" />
                <h2 className="text-[14px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Tech Stack</h2>
              </div>
              <InlineTechStackEditor
                projectId={projectId}
                techStack={project.techStack as Record<string, unknown> || {}}
              />
            </section>
          </div>

          {/* Git Integration */}
          <section className="space-y-[var(--sp-6)]">
            <div className="flex items-center gap-[var(--sp-3)] border-b border-[var(--color-border-default)] pb-[var(--sp-3)]">
              <GitBranch size={18} className="text-[var(--color-brand-bold)]" />
              <h2 className="text-[14px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Git Integration</h2>
            </div>

            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] p-[var(--sp-6)] shadow-[var(--shadow-card)] space-y-[var(--sp-6)]">
              <div className="space-y-[var(--sp-2)]">
                <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Repository Path / URL</label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="/path/to/repo or git@github.com:org/repo.git"
                  className="w-full h-[40px] px-[var(--sp-3)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[14px] font-mono focus:outline-none focus:border-[var(--color-border-selected)] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--sp-6)]">
                <div className="space-y-[var(--sp-2)]">
                  <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Default Branch</label>
                  <div className="relative">
                    <select
                      value={gitBranch}
                      onChange={(e) => setGitBranch(e.target.value)}
                      className="w-full h-[40px] pl-[var(--sp-3)] pr-[var(--sp-10)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[14px] focus:outline-none focus:border-[var(--color-border-selected)] transition-all appearance-none cursor-pointer"
                    >
                      <option value="main">main</option>
                      <option value="master">master</option>
                      <option value="develop">develop</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)]" />
                  </div>
                </div>
                <div className="space-y-[var(--sp-2)]">
                  <label className="block text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Merge Strategy</label>
                  <div className="relative">
                    <select
                      value={gitStrategy}
                      onChange={(e) => setGitStrategy(e.target.value)}
                      className="w-full h-[40px] pl-[var(--sp-3)] pr-[var(--sp-10)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[14px] focus:outline-none focus:border-[var(--color-border-selected)] transition-all appearance-none cursor-pointer"
                    >
                      <option value="merge">Merge</option>
                      <option value="rebase">Rebase</option>
                      <option value="squash">Squash</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)]" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-[var(--sp-2)]">
                <div>
                  {gitConfigMessage && (
                    <span className={cn("text-[12px] font-medium", gitConfigMessage.type === 'success' ? "text-[var(--status-success-text)]" : "text-[var(--color-text-danger)]")}>
                      {gitConfigMessage.text}
                    </span>
                  )}
                </div>
                <Button variant="secondary" onClick={handleSaveGitConfig} loading={isSavingGitConfig} icon={<Save size={14} />}>
                  Save Config
                </Button>
              </div>
            </div>
          </section>

          {/* Agent Access Tokens */}
          <section className="space-y-[var(--sp-6)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border-default)] pb-[var(--sp-3)]">
              <div className="flex items-center gap-[var(--sp-3)]">
                <Key size={18} className="text-[var(--color-brand-bold)]" />
                <h2 className="text-[14px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Agent Access Tokens</h2>
              </div>
              <Button variant="primary" size="small" onClick={() => setShowTokenDialog(true)} icon={<Plus size={16} />}>Generate New</Button>
            </div>

            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] p-[var(--sp-10)] shadow-[var(--shadow-card)] flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-bg-sunken)] flex items-center justify-center mb-[var(--sp-4)]">
                <Key size={24} className="text-[var(--color-text-tertiary)]" />
              </div>
              <p className="text-[14px] text-[var(--color-text-secondary)] mb-[var(--sp-2)]">No active agent tokens.</p>
              <p className="text-[12px] text-[var(--color-text-tertiary)] max-w-xs">Generate a token to allow the Spec-Drivr agent to interact with this repository.</p>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="space-y-[var(--sp-6)]">
            <div className="flex items-center gap-[var(--sp-3)] border-b border-[var(--color-text-danger)] pb-[var(--sp-3)] opacity-80">
              <AlertTriangle size={18} className="text-[var(--color-text-danger)]" />
              <h2 className="text-[14px] font-bold text-[var(--color-text-danger)] uppercase tracking-wider">Danger Zone</h2>
            </div>

            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-text-danger)] border-opacity-20 rounded-[var(--radius-lg)] p-[var(--sp-6)] shadow-[var(--shadow-card)]">
              {archiveMessage && (
                <div className={cn("mb-[var(--sp-4)] p-[var(--sp-3)] rounded-[var(--radius-sm)] border-l-4", archiveMessage.type === 'success' ? "bg-[var(--status-success-bg)] border-[var(--status-success-text)] text-[var(--status-success-text)]" : "bg-[var(--color-bg-sunken)] border-[var(--color-text-danger)] text-[var(--color-text-danger)]")}>
                  <p className="text-[12px] font-medium">{archiveMessage.text}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-[15px] font-bold text-[var(--color-text-primary)]">
                    {project.status === 'archived' ? 'Unarchive Project' : 'Archive Project'}
                  </h3>
                  <p className="text-[13px] text-[var(--color-text-tertiary)]">
                    {project.status === 'archived'
                      ? 'Make this project active and visible on the dashboard again.'
                      : 'Hides the project from the dashboard. Data is preserved but agent will stop.'}
                  </p>
                </div>
                <Button
                  variant={project.status === 'archived' ? 'secondary' : 'danger'}
                  onClick={() => setShowArchiveConfirm(true)}
                  loading={isArchiving}
                  icon={project.status === 'archived' ? <Archive size={14} /> : <AlertTriangle size={14} />}
                >
                  {project.status === 'archived' ? 'Unarchive' : 'Archive'}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <ArchiveProjectDialog
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={handleArchive}
        projectName={project.name}
        isArchived={project.status === 'archived'}
      />

      <GenerateTokenDialog
        isOpen={showTokenDialog}
        onClose={() => setShowTokenDialog(false)}
      />
    </div>
  );
}

function Plus({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
