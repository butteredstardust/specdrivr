'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShell } from '@/components/providers/shell-provider';
import { PixelInput, PixelButton, PixelAlert } from '@pxlkit/ui-kit';

export function CreateProjectForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const { setActiveProjectId } = useShell();

  const [name, setName] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [repositoryBranch, setRepositoryBranch] = useState('main');
  const [description, setDescription] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    if (!repositoryUrl.trim()) {
      setError('Repository URL is required.');
      return;
    }
    if (!repositoryUrl.startsWith('https://')) {
      setError('Repository URL must start with https://');
      return;
    }

    setIsLoading(true);

    try {
      const branch = repositoryBranch.trim() || 'main';

      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          repositoryUrl: repositoryUrl.trim(),
          repositoryBranch: branch,
          description: description.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to create project');
      }

      // Success
      const projectId = json.data?.id || json.id; // handle partial envelope fallback
      if (projectId) {
        setActiveProjectId(projectId);
      }

      onSuccess?.();
      router.push('/specs');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <PixelAlert tone="red" title="Error" message={error} />}

      <div className="flex flex-col gap-1">
        <label className="font-mono text-xs tracking-wider text-[--text-muted] uppercase">
          Project Name *
        </label>
        <PixelInput
          tone="purple"
          placeholder="My Project"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-mono text-xs tracking-wider text-[--text-muted] uppercase">
          Repository URL *
        </label>
        <PixelInput
          tone="purple"
          placeholder="https://github.com/org/repo"
          type="url"
          value={repositoryUrl}
          onChange={(e) => setRepositoryUrl(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-mono text-xs tracking-wider text-[--text-muted] uppercase">
          Branch
        </label>
        <PixelInput
          tone="purple"
          placeholder="main"
          defaultValue="main"
          value={repositoryBranch}
          onChange={(e) => setRepositoryBranch(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-mono text-xs tracking-wider text-[--text-muted] uppercase">
          Description
        </label>
        <PixelInput
          tone="purple"
          placeholder="Optional description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <PixelButton tone="purple" loading={isLoading} className="w-full" type="submit">
          Initialize Project
        </PixelButton>
      </div>
    </form>
  );
}
