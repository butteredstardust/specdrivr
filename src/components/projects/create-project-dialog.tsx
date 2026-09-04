'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { createProjectFormSchema, type CreateProjectFormValues } from '@/lib/schemas';
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectFormSchema),
    defaultValues: { name: '', description: '', githubRepo: '' },
  });

  const canCreate = userRole === 'admin' || userRole === 'owner';
  const label = triggerLabel ?? 'New Project';

  const onSubmit = async (values: CreateProjectFormValues) => {
    try {
      const response = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: values.name.trim(),
          description: values.description.trim() || undefined,
          githubRepo: values.githubRepo.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      setOpen(false);
      reset();
      router.refresh();
      toast.success('Project created');
    } catch (err) {
      clientLogger.error('Failed to create project', err);
      toast.error('Failed to create project');
    }
  };

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
            <DialogTitle>New project</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                placeholder="My awesome project"
                autoFocus
                aria-invalid={Boolean(errors.name)}
                {...register('name')}
              />
              {errors.name && <p className="text-danger text-xs">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-description">Description</Label>
              <Input
                id="project-description"
                placeholder="Optional description"
                aria-invalid={Boolean(errors.description)}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-danger text-xs">{errors.description.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-github-repo">GitHub Repo (owner/repo format)</Label>
              <Input
                id="project-github-repo"
                placeholder="owner/repo-name"
                aria-invalid={Boolean(errors.githubRepo)}
                {...register('githubRepo')}
              />
              {errors.githubRepo && (
                <p className="text-danger text-xs">{errors.githubRepo.message}</p>
              )}
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
