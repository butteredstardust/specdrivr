'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { SpecEditor } from '@/components/specs/spec-editor';
import type { SpecStatus } from '@/components/specs/spec-editor';
import { clientLogger } from '@/lib/logger-client';

interface Spec {
  id: number;
  name: string;
  status: SpecStatus;
  currentVersionId: number | null;
}

interface SpecVersion {
  id: number;
  versionNumber: number;
  markdownContent: string;
}

export default function EditSpecPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [spec, setSpec] = useState<Spec | null>(null);
  const [initialContent, setInitialContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        const [specRes, versionsRes] = await Promise.all([
          fetch(`/api/v1/specs/${id}`, { credentials: 'include' }),
          fetch(`/api/v1/specs/${id}/versions`, { credentials: 'include' }),
        ]);

        if (specRes.status === 401) {
          router.push('/login');
          return;
        }
        if (specRes.status === 404) {
          notFound();
          return;
        }

        const specData = (await specRes.json()) as { data: Spec };
        setSpec(specData.data);

        if (versionsRes.ok) {
          const versionsData = (await versionsRes.json()) as { data: SpecVersion[] };
          const versions = versionsData.data ?? [];
          if (versions.length > 0) {
            setInitialContent(versions[0]?.markdownContent ?? '');
          }
        }

        setIsLoading(false);
      } catch (e) {
        clientLogger.error('Failed to fetch spec', { error: e });
        notFound();
      }
    };
    fetchSpec();
  }, [id, router]);

  const handleSave = async (
    title: string,
    content: string
  ): Promise<{ success: boolean; specId?: number; error?: string }> => {
    try {
      // Update spec name
      const nameRes = await fetch(`/api/v1/specs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: title }),
      });
      if (!nameRes.ok) {
        const err = await nameRes.json().catch(() => ({}));
        return {
          success: false,
          error: (err as { error?: { message?: string } })?.error?.message ?? 'Failed to save',
        };
      }

      // Save content as a new version
      const versionRes = await fetch(`/api/v1/specs/${id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markdownContent: content }),
      });
      if (!versionRes.ok) {
        const err = await versionRes.json().catch(() => ({}));
        return {
          success: false,
          error:
            (err as { error?: { message?: string } })?.error?.message ?? 'Failed to save content',
        };
      }

      return { success: true, specId: Number(id) };
    } catch (e) {
      clientLogger.error('Failed to save spec', { error: e });
      return { success: false, error: 'Network error' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="text-accent-blue h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!spec) {
    return null;
  }

  return (
    <SpecEditor
      specId={spec.id}
      initialContent={initialContent}
      initialTitle={spec.name}
      specStatus={spec.status}
      onSave={handleSave}
    />
  );
}
