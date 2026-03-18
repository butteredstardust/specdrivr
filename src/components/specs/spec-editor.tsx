'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import ReactMarkdown from 'react-markdown';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { clientLogger } from '@/lib/logger-client';

export type SpecStatus =
  | 'drafting'
  | 'pending_plan'
  | 'pending_approval'
  | 'executing'
  | 'completed'
  | 'stalled'
  | 'archived';

interface SpecEditorProps {
  initialContent?: string;
  initialTitle?: string;
  specId?: number;
  specStatus?: SpecStatus;
  onSave: (title: string, content: string) => Promise<{ success: boolean; error?: string }>;
  onPublish?: () => void;
  className?: string;
}

export function SpecEditor(props: SpecEditorProps) {
  const {
    initialContent,
    initialTitle,
    specId: _specId,
    specStatus,
    onSave,
    onPublish: _onPublish,
    className,
  } = props;
  const [title, setTitle] = useState(initialTitle ?? '');
  const [content, setContent] = useState(initialContent ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDirty = title !== (initialTitle ?? '') || content !== (initialContent ?? '');

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    const result = await onSave(title, content);
    setIsSaving(false);
    if (result.success) {
      toast.success('Saved');
    } else {
      setSaveError(result.error ?? 'Failed to save');
    }
  }, [isSaving, onSave, title, content]);

  const handleSaveAndGenerate = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      // 1. Save spec
      const saveRes = await onSave(title, content);
      if (!saveRes.success) {
        setSaveError(saveRes.error ?? 'Failed to save spec');
        setIsSaving(false);
        return;
      }

      // 2. We need the spec ID to trigger generation.
      // If it's a new spec, onSave should have handled the redirect or returned the ID.
      // For now, let's assume we have specId if we're in edit mode.
      if (_specId) {
        const genRes = await fetch(`/api/v1/specs/${_specId}/plan/generate`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!genRes.ok) {
          toast.error('Spec saved, but plan generation failed to start.');
        } else {
          toast.success('Spec saved. Plan generation started.');
        }
      }
    } catch (err) {
      clientLogger.error('Save & Generate failed', err);
      toast.error('Failed to initiate plan generation');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, onSave, title, content, _specId]);

  // Ctrl+Enter / Cmd+Enter shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  // Unsaved changes guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const isReadOnly = specStatus === 'pending_plan';

  return (
    <div className={`flex flex-col h-screen${className ? ` ${className}` : ''}`}>
      {/* Top bar */}
      <div className="border-border-subtle flex shrink-0 items-center gap-3 border-b px-4 py-2">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled spec"
          className="text-text-primary placeholder:text-text-muted flex-1 border-none bg-transparent font-mono text-sm shadow-none outline-none focus-visible:ring-0"
        />
        {saveError && <p className="text-status-red text-sm">{saveError}</p>}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="h-8 font-mono text-[10px] tracking-widest uppercase"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Draft'}
          </Button>
          <Button
            size="sm"
            variant="violet"
            onClick={handleSaveAndGenerate}
            disabled={isSaving || !title.trim() || content.length < 50}
            className="h-8 gap-1.5"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Save & Generate Plan
              </>
            )}
          </Button>
        </div>
        <Link
          href="/specs"
          className="text-text-muted hover:text-text-secondary ml-2 font-mono text-xs transition-colors"
        >
          Back
        </Link>
      </div>

      {/* Warning banners */}
      {specStatus === 'executing' && (
        <Alert className="rounded-none border-x-0 border-t-0 border-amber-500/40 bg-amber-500/10 text-amber-300">
          <AlertDescription>
            This spec has an active execution session — edits may cause conflicts.
          </AlertDescription>
        </Alert>
      )}
      {specStatus === 'pending_approval' && (
        <Alert className="rounded-none border-x-0 border-t-0 border-amber-500/40 bg-amber-500/10 text-amber-300">
          <AlertDescription>
            Plan changes have been requested — address feedback before editing.
          </AlertDescription>
        </Alert>
      )}

      {/* Split pane */}
      <div className="grid flex-1 grid-cols-2 overflow-hidden">
        {/* Editor pane */}
        <div className="border-border-subtle h-full overflow-hidden border-r">
          <CodeMirror
            value={content}
            onChange={setContent}
            extensions={[markdown()]}
            theme="dark"
            height="100%"
            className="h-full"
            editable={!isReadOnly}
          />
        </div>

        {/* Preview pane */}
        <div className="prose prose-invert prose-sm max-w-none overflow-y-auto p-4">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
