'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import ReactMarkdown from 'react-markdown';
import { AlertTriangle, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { clientLogger } from '@/lib/logger-client';
import { specdrivrTheme } from '@/lib/editor-theme';

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
  onSave: (
    title: string,
    content: string
  ) => Promise<{ success: boolean; specId?: number; error?: string }>;
  onPublish?: () => void;
  className?: string;
}

export function SpecEditor(props: SpecEditorProps) {
  const router = useRouter();
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

      const savedSpecId = saveRes.specId ?? _specId;
      if (savedSpecId) {
        const genRes = await fetch(`/api/v1/specs/${savedSpecId}/plan/generate`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!genRes.ok) {
          toast.error('Spec saved, but plan generation failed to start.');
        } else {
          toast.success('Spec saved. Plan generation started.');
          router.push(`/specs/${savedSpecId}?tab=plan`);
        }
      }
    } catch (err) {
      clientLogger.error('Save & Generate failed', err);
      toast.error('Failed to initiate plan generation');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, onSave, title, content, _specId, router]);

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
      <div className="border-line-subtle flex shrink-0 flex-wrap items-center gap-3 border-b px-3 py-2 sm:px-4">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled spec"
          className="text-fg placeholder:text-fg-muted min-w-0 flex-1 basis-full border-none bg-transparent font-mono text-sm shadow-none sm:basis-auto"
        />
        {saveError && <p className="text-danger text-sm">{saveError}</p>}
        <div className="flex flex-1 gap-2 sm:flex-none">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="text-2xs h-8 flex-1 sm:flex-none"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Draft'}
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={handleSaveAndGenerate}
            disabled={isSaving || !title.trim() || content.length < 50}
            className="h-8 flex-1 gap-1.5 sm:flex-none"
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
          className="text-fg-muted hover:text-fg-secondary font-mono text-xs transition-colors sm:ml-2"
        >
          Back
        </Link>
      </div>

      {/* Warning banners */}
      {specStatus === 'executing' && (
        <Alert variant="warning" className="rounded-none border-x-0 border-t-0">
          <AlertTriangle />
          <AlertDescription>
            This spec has an active execution session — edits may cause conflicts.
          </AlertDescription>
        </Alert>
      )}
      {specStatus === 'pending_approval' && (
        <Alert variant="warning" className="rounded-none border-x-0 border-t-0">
          <AlertTriangle />
          <AlertDescription>
            Plan changes have been requested — address feedback before editing.
          </AlertDescription>
        </Alert>
      )}

      {/* Split pane */}
      <div className="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-2 md:overflow-hidden">
        {/* Editor pane */}
        <div className="border-line-subtle h-[50vh] overflow-hidden border-b md:h-full md:border-r md:border-b-0">
          <CodeMirror
            value={content}
            onChange={setContent}
            extensions={[markdown()]}
            theme={specdrivrTheme}
            height="100%"
            className="h-full"
            editable={!isReadOnly}
          />
        </div>

        {/* Preview pane */}
        <div className="markdown min-h-[40vh] overflow-y-auto p-4 md:min-h-0">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
