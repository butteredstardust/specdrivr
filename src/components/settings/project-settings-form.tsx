'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import type { UserRole } from '@/db/schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DangerZoneSection } from '@/components/settings/danger-zone-section';

interface ProjectSettingsFormProps {
  project: {
    id: number;
    name: string;
    description: string | null;
    repositoryUrl?: string | null;
  };
  userRole: UserRole;
  /** When true, renders only the Danger Zone section and hides the project fields form. */
  dangerZoneOnly?: boolean;
}

function canEdit(role: UserRole): boolean {
  return role === 'admin' || role === 'owner';
}

export function ProjectSettingsForm({
  project,
  userRole,
  dangerZoneOnly = false,
}: ProjectSettingsFormProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [githubRepo, setGithubRepo] = useState(project.repositoryUrl ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const editable = canEdit(userRole);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editable) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/v1/projects/${project.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, githubRepo }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }

      toast.success('Project updated');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to update project', error);
      toast.error('Failed to update project');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TooltipProvider>
      <section className="flex flex-col gap-4">
        {!dangerZoneOnly && (
          <h2 className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">
            PROJECT SETTINGS
          </h2>
        )}
        {!dangerZoneOnly && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs text-[--text-secondary]" htmlFor="project-name">
                Project name
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    id="project-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!editable}
                  />
                </TooltipTrigger>
                {!editable && <TooltipContent>Requires admin or owner role to edit</TooltipContent>}
              </Tooltip>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="font-mono text-xs text-[--text-secondary]"
                htmlFor="project-description"
              >
                Description
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    id="project-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!editable}
                  />
                </TooltipTrigger>
                {!editable && <TooltipContent>Requires admin or owner role to edit</TooltipContent>}
              </Tooltip>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-xs text-[--text-secondary]" htmlFor="project-github">
                GitHub repo (owner/repo)
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    id="project-github"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    placeholder="owner/repo-name"
                    disabled={!editable}
                  />
                </TooltipTrigger>
                {!editable && <TooltipContent>Requires admin or owner role to edit</TooltipContent>}
              </Tooltip>
            </div>

            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={!editable ? 0 : undefined}>
                    <Button type="submit" disabled={!editable || isSaving} size="sm">
                      {isSaving ? 'Saving…' : 'Save'}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!editable && <TooltipContent>Requires admin or owner role</TooltipContent>}
              </Tooltip>
            </div>
          </form>
        )}

        <div className="mt-4">
          <DangerZoneSection project={{ id: project.id, name: project.name }} userRole={userRole} />
        </div>
      </section>
    </TooltipProvider>
  );
}
