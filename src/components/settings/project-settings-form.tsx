'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { clientLogger } from '@/lib/logger-client';
import { projectSettingsFormSchema, type ProjectSettingsFormValues } from '@/lib/schemas';
import type { UserRole } from '@/db/schema';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProjectSettingsFormProps {
  project: {
    id: number;
    name: string;
    description: string | null;
    repositoryUrl?: string | null;
    repositoryBranch?: string | null;
  };
  userRole: UserRole;
}

type VerifyStatus = 'idle' | 'checking' | 'connected' | 'unreachable';

function canEdit(role: UserRole): boolean {
  return role === 'admin' || role === 'owner';
}

export function ProjectSettingsForm({ project, userRole }: ProjectSettingsFormProps) {
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle');

  const editable = canEdit(userRole);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { isSubmitting, errors },
  } = useForm<ProjectSettingsFormValues>({
    resolver: zodResolver(projectSettingsFormSchema),
    defaultValues: {
      name: project.name,
      description: project.description ?? '',
      repositoryUrl: project.repositoryUrl ?? '',
      repositoryBranch: project.repositoryBranch ?? 'main',
    },
  });

  // The repository URL input also drives the verify indicator, so its change
  // handler wraps rather than replaces the one `register` provides.
  const repositoryUrlField = register('repositoryUrl');

  const onSubmit = async (values: ProjectSettingsFormValues) => {
    if (!editable) return;

    try {
      const res = await fetch(`/api/v1/projects/${project.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          repositoryUrl: values.repositoryUrl || null,
          repositoryBranch: values.repositoryBranch || null,
        }),
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
    }
  };

  const handleVerifyConnection = async () => {
    const url = getValues('repositoryUrl').trim();
    if (!url) {
      toast.error('Enter a repository URL first.');
      return;
    }
    setVerifyStatus('checking');
    try {
      const params = new URLSearchParams({ url, projectId: String(project.id) });
      const res = await fetch(`/api/v1/verify-repo?${params.toString()}`, {
        credentials: 'include',
      });
      if (res.ok) {
        setVerifyStatus('connected');
      } else {
        clientLogger.warn('Repository verify returned non-OK', { status: res.status });
        setVerifyStatus('unreachable');
      }
    } catch (err) {
      clientLogger.error('Repo verify error', err instanceof Error ? err : new Error(String(err)));
      setVerifyStatus('unreachable');
    }
  };

  return (
    <TooltipProvider>
      <section className="border-line bg-surface-raised flex max-w-2xl flex-col gap-4 rounded-lg border p-6">
        <h3 className="text-fg text-base font-semibold">Project settings</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-fg-secondary text-xs" htmlFor="project-name">
              Project name
            </label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="project-name"
                  disabled={!editable}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'project-name-error' : undefined}
                  {...register('name')}
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires admin or owner role to edit</TooltipContent>}
            </Tooltip>
            {errors.name && (
              <p id="project-name-error" className="text-danger text-xs">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-fg-secondary text-xs" htmlFor="project-description">
              Description
            </label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Textarea
                  id="project-description"
                  disabled={!editable}
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={errors.description ? 'project-description-error' : undefined}
                  {...register('description')}
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires admin or owner role to edit</TooltipContent>}
            </Tooltip>
            {errors.description && (
              <p id="project-description-error" className="text-danger text-xs">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-fg-secondary text-xs" htmlFor="project-repo-url">
              Repository URL
            </label>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    id="project-repo-url"
                    placeholder="https://github.com/owner/repo"
                    disabled={!editable}
                    aria-invalid={Boolean(errors.repositoryUrl)}
                    aria-describedby={errors.repositoryUrl ? 'project-repo-url-error' : undefined}
                    className="flex-1"
                    {...repositoryUrlField}
                    onChange={(e) => {
                      setVerifyStatus('idle');
                      return repositoryUrlField.onChange(e);
                    }}
                  />
                </TooltipTrigger>
                {!editable && <TooltipContent>Requires admin or owner role to edit</TooltipContent>}
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={!editable ? 0 : undefined}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleVerifyConnection}
                      disabled={!editable || verifyStatus === 'checking'}
                      className="shrink-0"
                    >
                      {verifyStatus === 'checking' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        'Verify connection'
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!editable && <TooltipContent>Requires admin or owner role</TooltipContent>}
              </Tooltip>

              {verifyStatus === 'connected' && (
                <span className="text-success flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Connected
                </span>
              )}
              {verifyStatus === 'unreachable' && (
                <span className="text-fg-muted flex items-center gap-1 text-xs">
                  <XCircle className="h-3.5 w-3.5" />
                  Unreachable
                </span>
              )}
            </div>
            {errors.repositoryUrl && (
              <p id="project-repo-url-error" className="text-danger text-xs">
                {errors.repositoryUrl.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-fg-secondary text-xs" htmlFor="project-repo-branch">
              Default branch
            </label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="project-repo-branch"
                  placeholder="main"
                  disabled={!editable}
                  aria-invalid={Boolean(errors.repositoryBranch)}
                  aria-describedby={
                    errors.repositoryBranch ? 'project-repo-branch-error' : undefined
                  }
                  {...register('repositoryBranch')}
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires admin or owner role to edit</TooltipContent>}
            </Tooltip>
            {errors.repositoryBranch && (
              <p id="project-repo-branch-error" className="text-danger text-xs">
                {errors.repositoryBranch.message}
              </p>
            )}
          </div>

          <div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={!editable ? 0 : undefined}>
                  <Button type="submit" disabled={!editable || isSubmitting} size="sm">
                    {isSubmitting ? 'Saving changes…' : 'Save changes'}
                  </Button>
                </span>
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires admin or owner role</TooltipContent>}
            </Tooltip>
          </div>
        </form>
      </section>
    </TooltipProvider>
  );
}
