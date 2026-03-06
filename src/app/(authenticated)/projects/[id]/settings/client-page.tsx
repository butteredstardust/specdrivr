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
import Link from 'next/link';

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
    <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-page)]">
      {/* Page Header */}
      <div className="px-[24px] pt-[24px] pb-0 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-[8px] text-[13px] text-[var(--text-tertiary)] mb-[4px]">
          <Link href="/" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] no-underline transition-colors">Projects</Link>
          <span className="text-[var(--border-strong)]">/</span>
          <span>{project.name}</span>
        </div>
        {/* Title */}
        <h1 className="text-[22px] font-bold text-[var(--text-primary)] m-0 mb-[16px] leading-[1.2]">
          Project Settings
        </h1>

        <Tabs tabs={tabs} activeTab="settings" />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-[var(--sp-6)] py-[var(--sp-8)]">
        <div className="max-w-4xl space-y-[var(--sp-10)]">
          {/* General Settings */}
          <section className="space-y-[var(--sp-6)]">
            <div className="flex items-center h-[28px] pb-[8px] mt-[24px] mb-[var(--sp-4)] gap-[var(--sp-2)] border-b border-[var(--border-default)]">
              <Globe size={14} color="#94A3B8" />
              <h2 className="text-[#94A3B8] text-[11px] font-[600] uppercase tracking-[0.08em]">General Details</h2>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[var(--sp-6)] shadow-[var(--shadow-card)] space-y-[var(--sp-6)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--sp-6)]">
                <div className="space-y-[var(--sp-2)]">
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Project Name</label>
                  <input
                    type="text"
                    value={projectNameInput}
                    onChange={(e) => setProjectNameInput(e.target.value)}
                    className="w-full h-[40px] px-[var(--sp-3)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[14px] focus:outline-none focus:border-[var(--border-focus)] transition-all"
                  />
                </div>
                <div className="space-y-[var(--sp-2)]">
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Short Description</label>
                  <input
                    type="text"
                    value={projectDescriptionInput}
                    onChange={(e) => setProjectDescriptionInput(e.target.value)}
                    className="w-full h-[40px] px-[var(--sp-3)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[14px] focus:outline-none focus:border-[var(--border-focus)] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-[var(--sp-2)]">
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Core Mission</label>
                <textarea
                  value={projectMissionInput}
                  onChange={(e) => setProjectMissionInput(e.target.value)}
                  rows={3}
                  className="w-full p-[var(--sp-3)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[14px] focus:outline-none focus:border-[var(--border-focus)] transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-[var(--sp-2)]">
                <div>
                  {detailsMessage && (
                    <span className={cn("text-[12px] font-medium", detailsMessage.type === 'success' ? "text-[var(--status-done-text)]" : "text-[var(--status-blocked-text)]")}>
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
          <section className="space-y-[var(--sp-6)]">
            <div className="flex items-center h-[28px] pb-[8px] mt-[24px] mb-[var(--sp-4)] gap-[var(--sp-2)] border-b border-[var(--border-default)]">
              <ShieldAlert size={14} color="#94A3B8" />
              <h2 className="text-[#94A3B8] text-[11px] font-[600] uppercase tracking-[0.08em]">Project Intelligence</h2>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
              <div className="p-[var(--sp-6)] border-b border-[var(--border-default)]">
                <div className="flex items-center gap-[var(--sp-2)] mb-[var(--sp-4)]">
                  <ShieldAlert size={14} color="#94A3B8" />
                  <h3 className="text-[#94A3B8] text-[12px] font-bold">Constitution</h3>
                </div>
                <InlineConstitutionEditor
                  projectId={projectId}
                  constitution={project.constitution as string | null}
                />
              </div>

              <div className="p-[var(--sp-6)]">
                <div className="flex items-center gap-[var(--sp-2)] mb-[var(--sp-4)]">
                  <Database size={12} className="!text-[#94A3B8]" />
                  <h3 className="text-[#94A3B8] text-[12px] font-bold">Tech Stack</h3>
                </div>
                <InlineTechStackEditor
                  projectId={projectId}
                  techStack={project.techStack as Record<string, unknown> || {}}
                />
              </div>
            </div>
          </section>

          {/* Git Integration */}
          <section className="space-y-[var(--sp-6)]">
            <div className="flex items-center h-[28px] pb-[8px] mt-[24px] mb-[var(--sp-4)] gap-[var(--sp-2)] border-b border-[var(--border-default)]">
              <GitBranch size={12} className="!text-[#94A3B8]" />
              <h2 className="text-[#94A3B8] text-[11px] font-[600] uppercase tracking-[0.08em]">Git Integration</h2>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[var(--sp-6)] shadow-[var(--shadow-card)] space-y-[var(--sp-6)]">
              <div className="space-y-[var(--sp-2)]">
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Repository Path / URL</label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="/path/to/repo or git@github.com:org/repo.git"
                  className="w-full h-[40px] px-[var(--sp-3)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[14px] font-mono focus:outline-none focus:border-[var(--border-focus)] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--sp-6)]">
                <div className="space-y-[var(--sp-2)]">
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Default Branch</label>
                  <div className="relative">
                    <select
                      value={gitBranch}
                      onChange={(e) => setGitBranch(e.target.value)}
                      className="w-full h-[40px] pl-[var(--sp-3)] pr-[var(--sp-10)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[14px] focus:outline-none focus:border-[var(--border-focus)] transition-all appearance-none cursor-pointer"
                    >
                      <option value="main">main</option>
                      <option value="master">master</option>
                      <option value="develop">develop</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]" />
                  </div>
                </div>
                <div className="space-y-[var(--sp-2)]">
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Merge Strategy</label>
                  <div className="relative">
                    <select
                      value={gitStrategy}
                      onChange={(e) => setGitStrategy(e.target.value)}
                      className="w-full h-[40px] pl-[var(--sp-3)] pr-[var(--sp-10)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[14px] focus:outline-none focus:border-[var(--border-focus)] transition-all appearance-none cursor-pointer"
                    >
                      <option value="merge">Merge</option>
                      <option value="rebase">Rebase</option>
                      <option value="squash">Squash</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)]" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-[var(--sp-2)]">
                <div>
                  {gitConfigMessage && (
                    <span className={cn("text-[12px] font-medium", gitConfigMessage.type === 'success' ? "text-[var(--status-done-text)]" : "text-[var(--status-blocked-text)]")}>
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
            <div className="flex items-center justify-between h-[28px] pb-[8px] mt-[24px] mb-[var(--sp-4)] border-b border-[var(--border-default)]">
              <div className="flex items-center gap-[var(--sp-2)]">
                <Key size={12} className="!text-[#94A3B8]" />
                <h2 className="text-[11px] font-[600] text-[var(--text-tertiary)] uppercase tracking-[0.08em]">Access Controls</h2>
              </div>
              <Button variant="primary" size="small" onClick={() => setShowTokenDialog(true)} icon={<Plus size={16} />}>Generate Token</Button>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
              <div className="p-[var(--sp-6)] flex items-center justify-between">
                <div className="flex items-center gap-[var(--sp-4)]">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center">
                    <Key size={20} className="text-[var(--text-tertiary)]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">Agent Access Tokens</p>
                    <p className="text-[12px] text-[var(--text-tertiary)] max-w-sm">Active tokens required for specdrivr agents to interact with this repository.</p>
                  </div>
                </div>
                <div className="text-[13px] text-[var(--text-secondary)] font-medium bg-[var(--bg-sunken)] px-3 py-1 rounded-[var(--radius-sm)] border border-[var(--border-default)]">
                  No active tokens
                </div>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="space-y-[var(--sp-6)]">
            <div className="flex items-center gap-[var(--sp-3)] border-b border-[var(--status-blocked-text)] pb-[var(--sp-3)] opacity-80">
              <AlertTriangle size={18} className="text-[var(--text-secondary)]" />
              <h2 className="text-[14px] font-bold text-[var(--status-blocked-text)] uppercase tracking-wider">Danger Zone</h2>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--status-blocked-text)] border-opacity-20 rounded-[var(--radius-lg)] p-[var(--sp-6)] shadow-[var(--shadow-card)]">
              {archiveMessage && (
                <div className={cn("mb-[var(--sp-4)] p-[var(--sp-3)] rounded-[var(--radius-sm)] border-l-4", archiveMessage.type === 'success' ? "bg-[var(--status-success-bg)] border-[var(--status-success-text)] text-[var(--status-success-text)]" : "bg-[var(--bg-sunken)] border-[var(--status-blocked-text)] text-[var(--status-blocked-text)]")}>
                  <p className="text-[12px] font-medium">{archiveMessage.text}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
                    {project.status === 'archived' ? 'Unarchive Project' : 'Archive Project'}
                  </h3>
                  <p className="text-[13px] text-[var(--text-tertiary)]">
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
