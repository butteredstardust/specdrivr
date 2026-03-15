'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { SpecEditor } from '@/components/specs/spec-editor';
import { clientLogger } from '@/lib/logger-client';

type SpecStatus =
  | 'drafting'
  | 'pending_plan'
  | 'pending_approval'
  | 'executing'
  | 'completed'
  | 'stalled'
  | 'archived';

interface Spec {
  id: number;
  title: string;
  content: string;
  status: SpecStatus;
}

export default function EditSpecPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [spec, setSpec] = useState<Spec | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        const res = await fetch(`/api/v1/specs/${id}`, {
          credentials: 'include',
        });
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.status === 404) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }
        const data = (await res.json()) as { data: Spec };
        setSpec(data.data);
        setIsLoading(false);
      } catch (e) {
        clientLogger.error('Failed to fetch spec', { error: e });
        setNotFound(true);
        setIsLoading(false);
      }
    };
    fetchSpec();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async (
    title: string,
    content: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/v1/specs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          success: false,
          error: (err as { error?: { message?: string } })?.error?.message ?? 'Failed to save',
        };
      }
      return { success: true };
    } catch (e) {
      clientLogger.error('Failed to save spec', { error: e });
      return { success: false, error: 'Network error' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-[--accent-violet]" />
      </div>
    );
  }

  if (notFound || !spec) {
    return (
      <div className="flex h-screen items-center justify-center text-[--text-secondary]">
        Spec not found.
      </div>
    );
  }

  return (
    <SpecEditor
      specId={spec.id}
      initialContent={spec.content}
      initialTitle={spec.title}
      specStatus={spec.status}
      onSave={handleSave}
    />
  );
}
