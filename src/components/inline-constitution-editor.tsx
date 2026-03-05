'use client';

import { useState } from 'react';
import { updateConstitutionDev } from '@/lib/actions';

interface InlineConstitutionEditorProps {
  projectId: number;
  constitution: string | null;
  onUpdated?: () => void;
}

export function InlineConstitutionEditor({
  projectId,
  constitution,
  onUpdated,
}: InlineConstitutionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(constitution || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const result = await updateConstitutionDev(projectId, content);

      if (result.success) {
        setIsEditing(false);
        onUpdated?.();
      } else {
        setError(result.error || 'Failed to update constitution');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setContent(constitution || '');
    setError('');
  };

  return (
    <div className="bg-bg-elevated border border-border-default rounded-[8px] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[20px] font-semibold text-text-primary">Project Constitution</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 text-[11px] text-text-tertiary font-medium ios-button-secondary"
          >
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-opacity-10 border rounded-[8px]" style={{ backgroundColor: 'var(--status-error)', borderColor: 'var(--ios-separator)' }}>
          <p className="text-[11px] text-text-tertiary status-error">{error}</p>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border rounded-[8px] shadow-sm focus:outline-none"
            rows={8}
            placeholder="Enter project constitution..."
          />
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-[11px] text-text-tertiary font-medium ios-button-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-[11px] text-text-tertiary font-medium ios-button-primary disabled:opacity-50"
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-text-primary whitespace-pre-wrap">
          {content.trim() ? content : (
            <span className="text-text-secondary italic">No constitution defined. Click Edit to add one.</span>
          )}
        </div>
      )}
    </div>
  );
}
