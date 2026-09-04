'use client';

import { useRouter } from 'next/navigation';
import { useShell } from '@/components/shell/shell-context';
import { SpecEditor } from '@/components/specs/spec-editor';
import { clientLogger } from '@/lib/logger-client';
import { createSpecificationAction } from '@/actions/specifications';

export default function NewSpecPage() {
  const router = useRouter();
  const { activeProjectId } = useShell();

  const handleSave = async (
    title: string,
    content: string
  ): Promise<{ success: boolean; specId?: number; error?: string }> => {
    try {
      if (!activeProjectId) return { success: false, error: 'Select a project first' };
      const formData = new FormData();
      formData.set('projectId', String(activeProjectId));
      formData.set('name', title);
      formData.set('markdownContent', content);
      const result = await createSpecificationAction(formData);
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error?.message ?? 'Failed to create spec',
        };
      }
      router.replace(`/specs/${result.data.id}/edit`);
      return { success: true, specId: result.data.id };
    } catch (e) {
      clientLogger.error('Failed to create spec', { error: e });
      return { success: false, error: 'Network error' };
    }
  };

  return <SpecEditor onSave={handleSave} />;
}
