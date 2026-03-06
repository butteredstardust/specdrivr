'use client';

import { useState } from 'react';
import { updateTechStackDev } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Save, Plus, Trash2, Edit2 } from 'lucide-react';

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
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[var(--sp-6)] shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-[var(--sp-4)]">
        <h3 className="text-[14px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.05em]">Tech Stack</h3>
        {!isEditing && (
          <Button
            variant="ghost"
            size="small"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-[var(--sp-4)] p-[var(--sp-3)] bg-[var(--bg-sunken)] border-l-4 border-[var(--status-blocked-text)] text-[var(--status-blocked-text)] text-[12px] font-medium rounded-r-[var(--radius-sm)]">
          {error}
        </div>
      )}

      {isEditing ? (
        <div className="space-y-[var(--sp-6)]">
          <div className="space-y-[var(--sp-3)]">
            {entries.length === 0 && (
              <p className="text-[13px] text-[var(--text-tertiary)] italic py-[var(--sp-2)]">No tech stack items. Add one below.</p>
            )}
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-[var(--sp-2)] group">
                <input
                  type="text"
                  value={entry.key}
                  onChange={(e) => handleUpdateEntry(entry.id, 'key', e.target.value)}
                  className="flex-1 h-[36px] px-[var(--sp-3)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[13px] focus:outline-none focus:border-[var(--border-focus)] transition-all"
                  placeholder="Key (e.g. frontend)"
                />
                <input
                  type="text"
                  value={entry.value}
                  onChange={(e) => handleUpdateEntry(entry.id, 'value', e.target.value)}
                  className="flex-1 h-[36px] px-[var(--sp-3)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[13px] focus:outline-none focus:border-[var(--border-focus)] transition-all"
                  placeholder="Value (e.g. Next.js)"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveEntry(entry.id)}
                  className="text-[var(--status-blocked-text)] opacity-0 group-hover:opacity-100 transition-opacity"
                  icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>}
                />
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            size="small"
            onClick={handleAddEntry}
            className="text-[var(--brand-primary)] font-bold"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>}
          >
            Add New Technology
          </Button>

          <div className="flex justify-end gap-[var(--sp-2)] pt-[var(--sp-6)] border-t border-[var(--color-border-subtle)]">
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSubmitting || entries.every(e => !e.key.trim())}
              loading={isSubmitting}
            >
              Save Tech Stack
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {techStack && Object.keys(techStack).length > 0 ? (
            <div className="flex flex-wrap gap-[var(--sp-2)]">
              {Object.entries(techStack).map(([key, value]) => (
                <div
                  key={key}
                  className="inline-flex items-center px-[var(--sp-2)] py-[var(--sp-1)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[12px] shadow-sm"
                >
                  <span className="font-bold text-[var(--text-secondary)] mr-1.5 uppercase text-[10px] tracking-wider">{key}</span>
                  <span className="text-[var(--text-primary)] font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[13px] text-[var(--text-tertiary)] italic">No specific tech stack defined yet.</span>
          )}
        </div>
      )}
    </div>
  );
}
