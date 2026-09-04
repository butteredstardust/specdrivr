'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { UserRole } from '@/db/schema';

interface CreateProjectDialogProps {
  userRole: UserRole;
  triggerLabel?: string;
}

export function CreateProjectDialog({
  userRole,
  triggerLabel,
}: CreateProjectDialogProps): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [githubRepo, setGithubRepo] = useState('');

  const canCreate = userRole === 'admin' || userRole === 'owner';
  const label = triggerLabel ?? 'New Project';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          githubRepo: githubRepo.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      setOpen(false);
      setName('');
      setDescription('');
      setGithubRepo('');
      router.refresh();
      toast.success('Project created');
    } catch (err) {
      clientLogger.error('Failed to create project', err);
      toast.error('Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  }

  const triggerButton = (
    <Button
      variant="warning"
      size="sm"
      disabled={!canCreate}
      onClick={canCreate ? () => setOpen(true) : undefined}
      aria-disabled={!canCreate}
      className="gap-2"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </Button>
  );

  return (
    <>
      <TooltipProvider>
        {canCreate ? (
          triggerButton
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>{triggerButton}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Only admins and owners can create projects.</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My awesome project"
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-description">Description</Label>
              <Input
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-github-repo">GitHub Repo (owner/repo format)</Label>
              <Input
                id="project-github-repo"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="owner/repo-name"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? 'Creating…' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
