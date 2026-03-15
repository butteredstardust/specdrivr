'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { clientLogger } from '@/lib/logger-client';
import type { UserRole, AgentConfigSelect } from '@/db/schema';
import { usePolling } from '@/hooks/use-polling';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentConfigFormProps {
  projectId: number;
  userRole: UserRole;
}

interface AgentConfigData {
  modelId: string;
  planModelId: string;
  maxConcurrentTasks: number;
  taskTimeoutSeconds: number;
  maxRetriesPerTask: number;
  retryDelaySeconds: number;
  requireApproval: boolean;
  autoGeneratePlan: boolean;
  branchPrefix: string;
  commitMessagePrefix: string;
  allowedFileGlobs: string[];
  forbiddenFileGlobs: string[];
  testCommand: string | null;
  lintCommand: string | null;
  setupCommand: string | null;
  maxDiffSizeKb: number;
  prAutoCreate: boolean;
  prTargetBranch: string;
}

// ---------------------------------------------------------------------------
// Defaults (mirror schema defaults)
// ---------------------------------------------------------------------------

const DEFAULTS: AgentConfigData = {
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
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function canEdit(role: UserRole): boolean {
  return role === 'admin' || role === 'owner';
}

// ---------------------------------------------------------------------------
// GlobTagInput — renders a list of tags with an input to add more
// ---------------------------------------------------------------------------

interface GlobTagInputProps {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  disabled: boolean;
  placeholder?: string;
}

function GlobTagInput({ id, value, onChange, disabled, placeholder }: GlobTagInputProps) {
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
              className="flex items-center gap-1 rounded border border-[--border-default] bg-[--bg-surface] px-2 py-0.5 font-mono text-xs text-[--text-secondary]"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 text-[--text-muted] hover:text-[--text-primary]"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      <Input
        id={id}
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

function FormField({ label, htmlFor, helper, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="font-mono text-xs text-[--text-secondary] uppercase">
        {label}
      </Label>
      {children}
      {helper && <p className="text-xs text-[--text-muted]">{helper}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionHeading
// ---------------------------------------------------------------------------

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">{children}</h2>
  );
}

// ---------------------------------------------------------------------------
// AgentConfigForm
// ---------------------------------------------------------------------------

export function AgentConfigForm({ projectId, userRole }: AgentConfigFormProps) {
  const editable = canEdit(userRole);

  // Form state — initialised from DEFAULTS, overwritten on first data load
  const [form, setForm] = useState<AgentConfigData>(DEFAULTS);
  const [isSaving, setIsSaving] = useState(false);

  // AlertDialog for disabling requireApproval
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [pendingApprovalOff, setPendingApprovalOff] = useState(false);

  // One-shot fetch via usePolling — stop immediately after first successful load
  const onData = useCallback((data: AgentConfigSelect | null) => {
    if (!data) return;
    setForm({
      modelId: data.modelId ?? DEFAULTS.modelId,
      planModelId: data.planModelId ?? DEFAULTS.planModelId,
      maxConcurrentTasks: data.maxConcurrentTasks ?? DEFAULTS.maxConcurrentTasks,
      taskTimeoutSeconds: data.taskTimeoutSeconds ?? DEFAULTS.taskTimeoutSeconds,
      maxRetriesPerTask: data.maxRetriesPerTask ?? DEFAULTS.maxRetriesPerTask,
      retryDelaySeconds: data.retryDelaySeconds ?? DEFAULTS.retryDelaySeconds,
      requireApproval: data.requireApproval ?? DEFAULTS.requireApproval,
      autoGeneratePlan: data.autoGeneratePlan ?? DEFAULTS.autoGeneratePlan,
      branchPrefix: data.branchPrefix ?? DEFAULTS.branchPrefix,
      commitMessagePrefix: data.commitMessagePrefix ?? DEFAULTS.commitMessagePrefix,
      allowedFileGlobs: data.allowedFileGlobs ?? DEFAULTS.allowedFileGlobs,
      forbiddenFileGlobs: data.forbiddenFileGlobs ?? DEFAULTS.forbiddenFileGlobs,
      testCommand: data.testCommand ?? null,
      lintCommand: data.lintCommand ?? null,
      setupCommand: data.setupCommand ?? null,
      maxDiffSizeKb: data.maxDiffSizeKb ?? DEFAULTS.maxDiffSizeKb,
      prAutoCreate: data.prAutoCreate ?? DEFAULTS.prAutoCreate,
      prTargetBranch: data.prTargetBranch ?? DEFAULTS.prTargetBranch,
    });
  }, []);

  const onError = useCallback((err: Error) => {
    clientLogger.error('Failed to load agent config', err);
    toast.error('Failed to load agent configuration');
  }, []);

  const { isLoading } = usePolling<AgentConfigSelect | null>({
    url: `/api/v1/projects/${projectId}/agent-config`,
    stopWhen: () => true,
    onData,
    onError,
  });

  // ---------------------------------------------------------------------------
  // Field helpers
  // ---------------------------------------------------------------------------

  const set = <K extends keyof AgentConfigData>(key: K, value: AgentConfigData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editable) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/agent-config`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          // Coerce empty strings to null for nullable commands
          testCommand: form.testCommand?.trim() || null,
          lintCommand: form.lintCommand?.trim() || null,
          setupCommand: form.setupCommand?.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`
        );
      }

      toast.success('Agent configuration saved.');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to save agent config', error);
      toast.error('Failed to save agent configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // RequireApproval toggle — guard with AlertDialog when turning off
  // ---------------------------------------------------------------------------

  const handleRequireApprovalChange = (checked: boolean) => {
    if (!checked && form.requireApproval) {
      // Turning OFF — show confirmation dialog
      setPendingApprovalOff(true);
      setApprovalDialogOpen(true);
      return;
    }
    set('requireApproval', checked);
  };

  const confirmDisableApproval = () => {
    set('requireApproval', false);
    setPendingApprovalOff(false);
    setApprovalDialogOpen(false);
  };

  const cancelDisableApproval = () => {
    setPendingApprovalOff(false);
    setApprovalDialogOpen(false);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return <p className="font-mono text-xs text-[--text-muted]">Loading agent configuration…</p>;
  }

  return (
    <TooltipProvider>
      <form onSubmit={handleSave} className="flex flex-col gap-10">
        {/* ------------------------------------------------------------------ */}
        {/* EXECUTION                                                            */}
        {/* ------------------------------------------------------------------ */}
        <section className="flex flex-col gap-4">
          <SectionHeading>EXECUTION</SectionHeading>

          <FormField label="MODEL" htmlFor="modelId" helper="Execution model for tasks">
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="modelId"
                  value={form.modelId}
                  onChange={(e) => set('modelId', e.target.value)}
                  placeholder="claude-sonnet-4-6"
                  disabled={!editable}
                  className="font-mono text-sm"
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField
            label="PLAN MODEL"
            htmlFor="planModelId"
            helper="Model used for plan generation"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="planModelId"
                  value={form.planModelId}
                  onChange={(e) => set('planModelId', e.target.value)}
                  placeholder="claude-opus-4-6"
                  disabled={!editable}
                  className="font-mono text-sm"
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField label="MAX CONCURRENT TASKS" htmlFor="maxConcurrentTasks">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-4">
                  <Slider
                    id="maxConcurrentTasks"
                    min={1}
                    max={10}
                    step={1}
                    value={[form.maxConcurrentTasks]}
                    onValueChange={([v]) => set('maxConcurrentTasks', v!)}
                    disabled={!editable}
                    className="flex-1"
                  />
                  <span className="w-16 font-mono text-sm text-[--text-secondary]">
                    {form.maxConcurrentTasks} tasks
                  </span>
                </div>
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField
            label="TASK TIMEOUT (SECONDS)"
            htmlFor="taskTimeoutSeconds"
            helper={`Tasks will be killed after ${Math.round(form.taskTimeoutSeconds / 60)} minutes`}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="taskTimeoutSeconds"
                  type="number"
                  min={30}
                  max={3600}
                  value={form.taskTimeoutSeconds}
                  onChange={(e) => set('taskTimeoutSeconds', parseInt(e.target.value, 10) || 30)}
                  disabled={!editable}
                  className="font-mono text-sm"
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField label="MAX RETRIES" htmlFor="maxRetriesPerTask">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-4">
                  <Slider
                    id="maxRetriesPerTask"
                    min={0}
                    max={5}
                    step={1}
                    value={[form.maxRetriesPerTask]}
                    onValueChange={([v]) => set('maxRetriesPerTask', v!)}
                    disabled={!editable}
                    className="flex-1"
                  />
                  <span className="w-16 font-mono text-sm text-[--text-secondary]">
                    {form.maxRetriesPerTask}
                  </span>
                </div>
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField label="RETRY DELAY" htmlFor="retryDelaySeconds">
            <Tooltip>
              <TooltipTrigger asChild>
                <Select
                  value={String(form.retryDelaySeconds)}
                  onValueChange={(v) => set('retryDelaySeconds', parseInt(v, 10))}
                  disabled={!editable}
                >
                  <SelectTrigger id="retryDelaySeconds" className="font-mono text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15s</SelectItem>
                    <SelectItem value="30">30s</SelectItem>
                    <SelectItem value="60">1 min</SelectItem>
                    <SelectItem value="300">5 min</SelectItem>
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField label="MAX DIFF SIZE (KB)" htmlFor="maxDiffSizeKb">
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="maxDiffSizeKb"
                  type="number"
                  min={1}
                  value={form.maxDiffSizeKb}
                  onChange={(e) => set('maxDiffSizeKb', parseInt(e.target.value, 10) || 1)}
                  disabled={!editable}
                  className="font-mono text-sm"
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* EXECUTION COMMANDS                                                   */}
        {/* ------------------------------------------------------------------ */}
        <section className="flex flex-col gap-4">
          <SectionHeading>EXECUTION COMMANDS</SectionHeading>

          <FormField label="TEST COMMAND" htmlFor="testCommand">
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="testCommand"
                  value={form.testCommand ?? ''}
                  onChange={(e) => set('testCommand', e.target.value || null)}
                  placeholder="pnpm test"
                  disabled={!editable}
                  className="font-mono text-sm"
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField label="LINT COMMAND" htmlFor="lintCommand">
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="lintCommand"
                  value={form.lintCommand ?? ''}
                  onChange={(e) => set('lintCommand', e.target.value || null)}
                  placeholder="pnpm lint"
                  disabled={!editable}
                  className="font-mono text-sm"
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField label="SETUP COMMAND" htmlFor="setupCommand">
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="setupCommand"
                  value={form.setupCommand ?? ''}
                  onChange={(e) => set('setupCommand', e.target.value || null)}
                  placeholder="pnpm install"
                  disabled={!editable}
                  className="font-mono text-sm"
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* GIT SETTINGS                                                         */}
        {/* ------------------------------------------------------------------ */}
        <section className="flex flex-col gap-4">
          <SectionHeading>GIT SETTINGS</SectionHeading>

          <FormField label="BRANCH PREFIX" htmlFor="branchPrefix">
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="branchPrefix"
                  value={form.branchPrefix}
                  onChange={(e) => set('branchPrefix', e.target.value)}
                  placeholder="daemon"
                  disabled={!editable}
                  className="font-mono text-sm"
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField label="COMMIT PREFIX" htmlFor="commitMessagePrefix">
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="commitMessagePrefix"
                  value={form.commitMessagePrefix}
                  onChange={(e) => set('commitMessagePrefix', e.target.value)}
                  placeholder="feat"
                  disabled={!editable}
                  className="font-mono text-sm"
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="prAutoCreate"
              className="font-mono text-xs text-[--text-secondary] uppercase"
            >
              AUTO-CREATE PULL REQUESTS
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={!editable ? 0 : undefined}>
                  <Switch
                    id="prAutoCreate"
                    checked={form.prAutoCreate}
                    onCheckedChange={(v) => set('prAutoCreate', v)}
                    disabled={!editable}
                  />
                </span>
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </div>

          <FormField label="PR TARGET BRANCH" htmlFor="prTargetBranch">
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="prTargetBranch"
                  value={form.prTargetBranch}
                  onChange={(e) => set('prTargetBranch', e.target.value)}
                  placeholder="main"
                  disabled={!editable}
                  className="font-mono text-sm"
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* PLANNING                                                             */}
        {/* ------------------------------------------------------------------ */}
        <section className="flex flex-col gap-4">
          <SectionHeading>PLANNING</SectionHeading>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="requireApproval"
              className="font-mono text-xs text-[--text-secondary] uppercase"
            >
              REQUIRE PLAN APPROVAL
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={!editable ? 0 : undefined}>
                  <Switch
                    id="requireApproval"
                    checked={pendingApprovalOff ? true : form.requireApproval}
                    onCheckedChange={handleRequireApprovalChange}
                    disabled={!editable}
                  />
                </span>
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </div>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="autoGeneratePlan"
              className="font-mono text-xs text-[--text-secondary] uppercase"
            >
              AUTO-GENERATE PLAN ON SPEC SAVE
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={!editable ? 0 : undefined}>
                  <Switch
                    id="autoGeneratePlan"
                    checked={form.autoGeneratePlan}
                    onCheckedChange={(v) => set('autoGeneratePlan', v)}
                    disabled={!editable}
                  />
                </span>
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* FILE BOUNDARIES                                                      */}
        {/* ------------------------------------------------------------------ */}
        <section className="flex flex-col gap-4">
          <SectionHeading>FILE BOUNDARIES</SectionHeading>

          <FormField
            label="ALLOWED FILE GLOBS"
            htmlFor="allowedFileGlobs"
            helper="Type a glob pattern and press Enter or comma to add. Leave empty to allow all files."
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <GlobTagInput
                    id="allowedFileGlobs"
                    value={form.allowedFileGlobs}
                    onChange={(v) => set('allowedFileGlobs', v)}
                    disabled={!editable}
                    placeholder="src/**/*.ts"
                  />
                </div>
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField
            label="FORBIDDEN FILE GLOBS"
            htmlFor="forbiddenFileGlobs"
            helper="Files matching these patterns will never be touched by the agent."
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <GlobTagInput
                    id="forbiddenFileGlobs"
                    value={form.forbiddenFileGlobs}
                    onChange={(v) => set('forbiddenFileGlobs', v)}
                    disabled={!editable}
                    placeholder="**/*.env"
                  />
                </div>
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* AGENT TOKEN                                                          */}
        {/* ------------------------------------------------------------------ */}
        <section className="flex flex-col gap-4">
          <SectionHeading>AGENT TOKEN</SectionHeading>

          <div className="rounded-md border border-[--border-default] bg-[--bg-surface] p-4">
            <p className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">
              AGENT TOKEN
            </p>
            <p className="mt-2 font-mono text-sm text-[--text-primary]">sdk_••••••••••••</p>
            <p className="mt-1 text-xs text-[--text-muted]">
              This token is set via environment variable. Rotate it in your infrastructure, then
              update AGENT_TOKEN.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Save button                                                          */}
        {/* ------------------------------------------------------------------ */}
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={!editable ? 0 : undefined}>
                <Button type="submit" disabled={!editable || isSaving} size="sm">
                  {isSaving ? 'Saving…' : 'Save Configuration'}
                </Button>
              </span>
            </TooltipTrigger>
            {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
          </Tooltip>
        </div>
      </form>

      {/* RequireApproval confirmation dialog */}
      <AlertDialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable plan approval?</AlertDialogTitle>
            <AlertDialogDescription>
              Disabling plan approval means sessions will start automatically. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDisableApproval}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisableApproval}>Disable Approval</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
