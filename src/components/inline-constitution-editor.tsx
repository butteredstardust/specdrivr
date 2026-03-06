'use client';

import { useState } from 'react';
import { updateConstitutionDev } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Save, Edit2 } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';


function renderMarkdown(text: string) {
  let inList = false;
  const lines = text.split('\n');
  let result = '';

  for (let line of lines) {
    if (line.trim().startsWith('- ')) {
      if (!inList) {
        result += '<ul class="list-disc ml-6 my-2">';
        inList = true;
      }
      let lineContent = line.trim().substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      result += `<li class="mb-1">${lineContent}</li>`;
    } else {
      if (inList) {
        result += '</ul>';
        inList = false;
      }
      if (line.startsWith('## ')) {
        result += `<h3 class="text-[16px] font-bold mt-[16px] mb-[8px]">${line.substring(3).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</h3>`;
      } else if (line.startsWith('# ')) {
        result += `<h2 class="text-[18px] font-bold mt-[20px] mb-[12px]">${line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</h2>`;
      } else if (line.trim() === '') {
        result += '<br/>';
      } else {
        result += `<span class="block mb-[8px]">${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</span>`;
      }
    }
  }
  if (inList) result += '</ul>';
  return result;
}

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
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[var(--sp-6)] shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-[var(--sp-4)]">
        <h3 className="text-[14px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.05em]">Project Constitution</h3>
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
        <div className="space-y-[var(--sp-4)]">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-[var(--sp-3)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[14px] focus:outline-none focus:border-[var(--border-focus)] transition-all min-h-[200px]"
            placeholder="Outline the rules and guidelines for this project..."
          />
          <div className="flex justify-end gap-[var(--sp-2)]">
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
              disabled={isSubmitting || !content.trim()}
              loading={isSubmitting}
            >
              Save Constitution
            </Button>
          </div>
        </div>
      ) : content.trim() ? (
        <div
          className="text-[14px] text-[var(--text-primary)] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown(content)) }}
        />
      ) : (
        <div className="text-[14px] text-[var(--text-primary)] leading-relaxed">
          <span className="text-[var(--text-tertiary)] italic">No constitution defined yet.</span>
        </div>
      )}
    </div>
  );
}
