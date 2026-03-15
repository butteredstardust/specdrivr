'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import type { UserRole } from '@/db/schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ProjectSettingsFormProps {
  project: {
    id: number;
    name: string;
    description: string | null;
    repositoryUrl?: string | null;
  };
  userRole: UserRole;
}

function canEdit(role: UserRole): boolean {
  return role === 'admin' || role === 'owner';
}

function canDelete(role: UserRole): boolean {
  return role === 'owner';
}

export function ProjectSettingsForm({ project, userRole }: ProjectSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [githubRepo, setGithubRepo] = useState(project.repositoryUrl ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const editable = canEdit(userRole);
  const deletable = canDelete(userRole);

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

  const handleDelete = async () => {
    if (!deletable) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/v1/projects/${project.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }

      toast.success('Project deleted');
      router.push('/projects');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to delete project', error);
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <TooltipProvider>
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">
          PROJECT SETTINGS
        </h2>
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

        {/* Danger Zone */}
        <div className="mt-4 rounded border border-red-900/40 p-4">
          <h3 className="mb-3 font-mono text-xs tracking-widest text-red-400 uppercase">
            Danger Zone
          </h3>
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-xs text-[--text-muted]">
              Permanently delete this project and all its data.
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={!deletable ? 0 : undefined}>
                  <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={!deletable}
                        onClick={() => setDeleteOpen(true)}
                      >
                        Delete Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="font-mono">Delete project?</DialogTitle>
                        <DialogDescription className="font-mono text-xs">
                          This action cannot be undone. All specs, sessions, and data for{' '}
                          <strong>{project.name}</strong> will be permanently deleted.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteOpen(false)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting…' : 'Delete'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </span>
              </TooltipTrigger>
              {!deletable && <TooltipContent>Only project owners can delete</TooltipContent>}
            </Tooltip>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}
