'use client';

import { useState } from 'react';
import { updateSpecificationDev } from '@/lib/actions';
import { SpecificationSelect } from '@/db/schema';
import MDEditor from '@uiw/react-md-editor';
import { Button } from './ui/button';
import { History, ChevronDown, Edit, X, Save, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineSpecEditorProps {
  specification: SpecificationSelect;
  allSpecs?: SpecificationSelect[];
  onSpecUpdated?: (spec: SpecificationSelect) => void;
}

export function InlineSpecEditor({ specification, allSpecs = [], onSpecUpdated }: InlineSpecEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(specification.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [viewingSpecId, setViewingSpecId] = useState<number | null>(null);

  const allVersions = allSpecs.length > 0 ? allSpecs : [specification];
  const currentSpec = viewingSpecId !== null
    ? allVersions.find(s => s.id === viewingSpecId) || specification
    : specification;
  const isViewingHistorical = currentSpec.id !== specification.id;

  const handleSave = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const result = await updateSpecificationDev(specification.id, content);
      if (result.success && result.spec) {
        setIsEditing(false);
        setViewingSpecId(null);
        onSpecUpdated?.(result.spec);
      } else {
        setError(result.error || 'Failed to update specification');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setContent(specification.content);
    setError('');
    setViewingSpecId(null);
  };

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
      {/* Header */}
      <div className="px-[var(--sp-6)] py-[var(--sp-3)] border-b border-[var(--color-border-default)] flex items-center justify-between bg-[var(--color-bg-primary)]">
        <div className="flex items-center gap-[var(--sp-4)]">
          <h3 className="text-[14px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Specification
          </h3>
          {allVersions.length > 1 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 px-[var(--sp-2)] py-1 text-[12px] font-semibold text-[var(--color-brand-bold)] hover:bg-[var(--color-bg-sunken)] rounded-[var(--radius-sm)] transition-colors"
            >
              <History size={14} />
              <span>v{currentSpec.version}</span>
              <ChevronDown size={14} />
            </button>
          )}
          {isViewingHistorical && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[var(--status-todo-bg)] text-[var(--status-todo-text)] rounded-full text-[11px] font-bold">
              HISTORICAL
            </span>
          )}
        </div>

        <div className="flex items-center gap-[var(--sp-2)]">
          {!isEditing ? (
            <Button
              variant="secondary"
              size="small"
              onClick={() => setIsEditing(true)}
              icon={<Edit size={14} />}
            >
              {isViewingHistorical ? 'Restore & Edit' : 'Edit'}
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="small" onClick={handleCancel} disabled={isSubmitting} icon={<X size={14} />}>
                Cancel
              </Button>
              <Button variant="primary" size="small" onClick={handleSave} loading={isSubmitting} disabled={!content.trim()} icon={<Save size={14} />}>
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* History List */}
      {showHistory && (
        <div className="bg-[var(--color-bg-sunken)] border-b border-[var(--color-border-default)] p-[var(--sp-4)]">
          <p className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-[var(--sp-3)]">Version History</p>
          <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 linear-scrollbar">
            {allVersions.map((spec) => (
              <button
                key={spec.id}
                onClick={() => { setViewingSpecId(spec.id); setShowHistory(false); if (spec.id === specification.id) setIsEditing(false); }}
                className={cn(
                  "w-full flex items-center justify-between p-[var(--sp-3)] border rounded-[var(--radius-sm)] transition-all text-left",
                  currentSpec.id === spec.id
                    ? "bg-[var(--color-bg-selected)] border-[var(--color-border-selected)] text-[var(--color-brand-bold)]"
                    : "bg-[var(--color-bg-surface)] border-[var(--color-border-default)] hover:border-[var(--color-border-selected)]"
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold">v{spec.version}</span>
                    {spec.isActive && <span className="px-1.5 py-0.5 bg-[var(--status-inprogress-bg)] text-[var(--status-inprogress-text)] text-[10px] font-bold rounded-full">ACTIVE</span>}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)] mt-1">
                    <Clock size={10} />
                    {new Date(spec.createdAt).toLocaleString()}
                  </div>
                </div>
                <ChevronRight size={14} className="text-[var(--color-text-tertiary)]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="p-[var(--sp-6)]">
        {error && (
          <div className="mb-[var(--sp-4)] p-[var(--sp-3)] bg-[var(--color-bg-sunken)] border-l-4 border-[var(--color-text-danger)] rounded-[var(--radius-sm)]">
            <p className="text-[12px] text-[var(--color-text-danger)] font-medium">{error}</p>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-[var(--sp-4)]">
            {isViewingHistorical && (
              <div className="p-[var(--sp-3)] bg-[var(--color-bg-sunken)] border-l-4 border-[var(--color-status-inprogress-text)] rounded-[var(--radius-sm)] flex items-center gap-3">
                <CheckCircle2 size={16} className="text-[var(--status-inprogress-text)]" />
                <p className="text-[12px] text-[var(--color-text-primary)]">
                  Restoring version <strong>v{currentSpec.version}</strong>. Saving will create a new current version.
                </p>
              </div>
            )}
            <div data-color-mode="light" className="jira-editor">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                preview="edit"
                height={500}
              />
            </div>
          </div>
        ) : (
          <div data-color-mode="light" className="prose prose-sm max-w-none">
            <MDEditor.Markdown
              source={currentSpec.content}
              style={{ backgroundColor: 'transparent', color: 'var(--color-text-primary)' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
