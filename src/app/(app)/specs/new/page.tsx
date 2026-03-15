'use client';

import { useRouter } from 'next/navigation';
import { useShell } from '@/components/shell/shell-context';
import { SpecEditor } from '@/components/specs/spec-editor';
import { clientLogger } from '@/lib/logger-client';

export default function NewSpecPage() {
  const router = useRouter();
  const { activeProjectId } = useShell();

  const handleSave = async (
    title: string,
    content: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/v1/specs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, content, projectId: activeProjectId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return {
          success: false,
          error:
            (err as { error?: { message?: string } })?.error?.message ?? 'Failed to create spec',
        };
      }
      const data = (await res.json()) as { data: { id: number } };
      router.replace(`/specs/${data.data.id}/edit`);
      return { success: true };
    } catch (e) {
      clientLogger.error('Failed to create spec', { error: e });
      return { success: false, error: 'Network error' };
    }
  };

  return <SpecEditor onSave={handleSave} />;
}
