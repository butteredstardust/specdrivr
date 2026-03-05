'use client';

import { useState } from 'react';
import { updateTechStackDev } from '@/lib/actions';

interface InlineTechStackEditorProps {
  projectId: number;
  techStack: Record<string, unknown> | null;
  onUpdated?: () => void;
}

export function InlineTechStackEditor({
  projectId,
  techStack,
  onUpdated,
}: InlineTechStackEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');

  // Convert techStack object to editable key-value pairs
  const techStackEntries = techStack
    ? Object.entries(techStack).map(([key, value], index) => ({
      id: index,
      key,
      value: String(value),
    }))
    : [];

  const [entries, setEntries] = useState(techStackEntries);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddEntry = () => {
    const newId = entries.length > 0 ? Math.max(...entries.map(e => e.id)) + 1 : 0;
    setEntries([...entries, { id: newId, key: '', value: '' }]);
  };

  const handleRemoveEntry = (id: number) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const handleUpdateEntry = (id: number, field: 'key' | 'value', value: string) => {
    setEntries(entries.map(e => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError('');

    // Convert entries back to object, filtering out empty keys
    const techStackObj: Record<string, unknown> = {};
    for (const entry of entries) {
      if (entry.key.trim()) {
        techStackObj[entry.key] = entry.value;
      }
    }

    try {
      const result = await updateTechStackDev(projectId, techStackObj);

      if (result.success) {
        setIsEditing(false);
        onUpdated?.();
      } else {
        setError(result.error || 'Failed to update tech stack');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEntries(techStackEntries);
    setError('');
  };

  return (
    <div className="bg-bg-elevated border border-border-default rounded-[8px] shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold text-ios-primary ">Tech Stack</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 text-[11px] text-text-tertiary font-medium text-accent bg-ios-secondary border border-ios rounded-[8px]  transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-opacity-10 border rounded-[8px]" style={{ backgroundColor: 'var(--status-error)', borderColor: 'var(--ios-separator)' }}>
          <p className="text-[11px] text-text-tertiary text-status-error ">{error}</p>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div key={entry.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={entry.key}
                  onChange={(e) => handleUpdateEntry(entry.id, 'key', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., frontend"
                />
                <input
                  type="text"
                  value={entry.value}
                  onChange={(e) => handleUpdateEntry(entry.id, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., React"
                />
                <button
                  onClick={() => handleRemoveEntry(entry.id)}
                  className="px-3 py-2 text-[11px] text-text-tertiary font-medium text-status-error bg-ios-secondary border border-ios rounded-[8px]  transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleAddEntry}
            className="px-4 py-2 text-[11px] text-text-tertiary font-medium text-accent bg-ios-secondary border border-ios rounded-[8px]  transition-colors"
          >
            + Add Technology
          </button>
          <div className="flex justify-end space-x-3 pt-4 border-t border-ios">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-[11px] text-text-tertiary font-medium text-accent bg-ios-secondary border border-ios rounded-[8px]  transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-[11px] text-text-tertiary font-medium text-white rounded-[8px]  transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
              disabled={isSubmitting || entries.every(e => !e.key.trim())}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          {techStack && Object.keys(techStack).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(techStack).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center px-3 py-1 rounded-ios-xl text-[11px] text-text-tertiary bg-accent/10 text-accent "
                >
                  <span className="font-medium">{key}:</span>
                  <span className="ml-1">{String(value)}</span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[13px] text-text-tertiary italic ">No technologies defined. Click Edit to add some.</span>
          )}
        </div>
      )}
    </div>
  );
}
