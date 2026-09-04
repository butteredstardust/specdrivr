'use client';

import { useState } from 'react';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { UserRole } from '@/db/schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { agentConfigFormSchema, type AgentConfigFormData } from '@/lib/schemas';

/**
 * Shared pieces of the agent configuration form.
 *
 * The form was a single 859-line component holding seven unrelated sections.
 * Each section is now its own file and reaches the form through react-hook-form's
 * `FormProvider`, so nothing has to be prop-drilled. These are the parts they
 * all need.
 */

export type FormValues = z.infer<typeof agentConfigFormSchema>;

export const DEFAULTS: AgentConfigFormData = {
  modelId: 'claude-sonnet-4-6',
  planModelId: 'claude-opus-4-6',
  maxConcurrentTasks: 3,
  taskTimeoutSeconds: 300,
  maxRetriesPerTask: 2,
  retryDelaySeconds: 30,
  requireApproval: true,
  autoGeneratePlan: false,
  branchPrefix: 'daemon',
  commitMessagePrefix: 'feat',
  allowedFileGlobs: [],
  forbiddenFileGlobs: [],
  testCommand: null,
  lintCommand: null,
  setupCommand: null,
  maxDiffSizeKb: 500,
  prAutoCreate: false,
  prTargetBranch: 'main',
  geminiApiKey: null,
  geminiModel: 'gemini-2.0-flash',
  claudeApiKey: null,
  backend: 'gemini',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function canEdit(role: UserRole): boolean {
  return role === 'admin' || role === 'owner';
}

// ---------------------------------------------------------------------------
// GlobTagInput — renders a list of tags with an input to add more
// ---------------------------------------------------------------------------

export interface GlobTagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  disabled: boolean;
  placeholder?: string;
}

export function GlobTagInput({ value, onChange, disabled, placeholder }: GlobTagInputProps) {
  const [inputVal, setInputVal] = useState('');

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === 'Backspace' && inputVal === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (inputVal.trim()) {
      addTag(inputVal);
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="border-line bg-surface-raised text-fg-secondary flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs"
            >
              {tag}
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTag(tag)}
                  className="text-fg-muted hover:text-fg ml-0.5 h-4 w-4 shrink-0 p-0"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </span>
          ))}
        </div>
      )}
      <Input
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder ?? 'Type a glob and press Enter'}
        className="font-mono text-xs"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormField — label + optional helper text wrapper
// ---------------------------------------------------------------------------

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  helper?: React.ReactNode;
  children: React.ReactNode;
}

export function FormField({ label, htmlFor, helper, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-fg-secondary text-xs font-medium">
        {label}
      </Label>
      {children}
      {helper && <p className="text-fg-muted text-xs">{helper}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionHeading
// ---------------------------------------------------------------------------

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-fg text-sm font-semibold">{children}</h2>;
}

// ---------------------------------------------------------------------------
// AgentConfigForm
// ---------------------------------------------------------------------------
