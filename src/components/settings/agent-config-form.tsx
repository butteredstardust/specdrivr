'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { clientLogger } from '@/lib/logger-client';
import type { UserRole } from '@/db/schema';
import type { PublicAgentConfig } from '@/lib/agent-config-public';
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
import { agentConfigFormSchema, type AgentConfigFormData } from '@/lib/schemas';
import { updateAgentConfigAction } from '@/actions/settings';
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormValues = z.infer<typeof agentConfigFormSchema>;

interface AgentConfigFormProps {
  projectId: number;
  userRole: UserRole;
}

// ---------------------------------------------------------------------------
// Defaults (mirror schema defaults)
// ---------------------------------------------------------------------------

const DEFAULTS: AgentConfigFormData = {
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

function canEdit(role: UserRole): boolean {
  return role === 'admin' || role === 'owner';
}

// ---------------------------------------------------------------------------
// GlobTagInput — renders a list of tags with an input to add more
// ---------------------------------------------------------------------------

interface GlobTagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  disabled: boolean;
  placeholder?: string;
}

function GlobTagInput({ value, onChange, disabled, placeholder }: GlobTagInputProps) {
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

function FormField({ label, htmlFor, helper, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-fg-secondary font-mono text-xs uppercase">
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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-fg-muted font-mono text-xs tracking-widest uppercase">{children}</h2>;
}

// ---------------------------------------------------------------------------
// AgentConfigForm
// ---------------------------------------------------------------------------

export function AgentConfigForm({ projectId, userRole }: AgentConfigFormProps) {
  const editable = canEdit(userRole);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting, isDirty },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(agentConfigFormSchema),
    defaultValues: DEFAULTS,
  });

  // AlertDialog state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  // One-shot fetch via usePolling — stop immediately after first successful load
  const onData = useCallback(
    (data: PublicAgentConfig | null) => {
      if (!data) return;
      reset({
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
        geminiApiKey: DEFAULTS.geminiApiKey,
        geminiModel: data.geminiModel ?? DEFAULTS.geminiModel,
        claudeApiKey: DEFAULTS.claudeApiKey,
        backend: (data.backend as 'gemini' | 'claude') ?? DEFAULTS.backend,
      });
    },
    [reset]
  );

  const onError = useCallback((err: Error) => {
    clientLogger.error('Failed to load agent config', err);
    toast.error('Failed to load agent configuration');
  }, []);

  const { isLoading } = usePolling<PublicAgentConfig | null>({
    url: `/api/v1/projects/${projectId}/agent-config`,
    stopWhen: () => true,
    onData,
    onError,
  });

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const onFormSubmit = async (data: FormValues) => {
    if (!editable) return;

    try {
      const formData = new FormData();
      formData.append('projectId', String(projectId));

      Object.entries(data).forEach(([key, val]) => {
        if (Array.isArray(val)) {
          val.forEach((v) => formData.append(key, String(v)));
        } else if (val !== null && val !== undefined) {
          if (key === 'testCommand' || key === 'lintCommand' || key === 'setupCommand') {
            formData.append(key, String(val).trim());
          } else {
            formData.append(key, String(val));
          }
        }
      });

      const res = await updateAgentConfigAction(formData);

      if (!res.success) {
        throw new Error(res.error?.message ?? 'Failed to update agent config');
      }

      toast.success('Agent configuration saved.');
      reset(data); // Mark form as pristine
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      clientLogger.error('Failed to save agent config', error);
      toast.error('Failed to save agent configuration');
    }
  };

  const currentRequireApproval = watch('requireApproval');

  const handleRequireApprovalChange = (checked: boolean) => {
    if (!checked && currentRequireApproval) {
      setApprovalDialogOpen(true);
      return;
    }
    setValue('requireApproval', checked, { shouldDirty: true });
  };

  const confirmDisableApproval = () => {
    setValue('requireApproval', false, { shouldDirty: true });
    setApprovalDialogOpen(false);
  };

  const cancelDisableApproval = () => {
    setApprovalDialogOpen(false);
  };

  if (isLoading) {
    return <p className="text-fg-muted font-mono text-xs">Loading agent configuration…</p>;
  }

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-10">
        {/* ------------------------------------------------------------------ */}
        {/* AI PROVIDERS                                                         */}
        {/* ------------------------------------------------------------------ */}
        <section className="flex flex-col gap-4">
          <SectionHeading>AI PROVIDERS</SectionHeading>

          <FormField
            label="EXECUTION BACKEND"
            helper="Which AI agent executes your tasks. Both require the respective CLI installed on the agent machine."
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Controller
                    name="backend"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!editable}
                      >
                        <SelectTrigger className="font-mono text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini">Gemini CLI</SelectItem>
                          <SelectItem value="claude">Claude Code</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Gemini Group */}
            <div className="border-line bg-surface-raised flex flex-col gap-4 rounded-md border p-4">
              <p className="text-fg-secondary font-mono text-xs tracking-widest uppercase">
                Google Gemini
              </p>

              <FormField
                label="GEMINI API KEY"
                helper="Project-specific API key. Leave blank to use system default."
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      {...register('geminiApiKey')}
                      type="password"
                      placeholder="AIzaSy..."
                      disabled={!editable}
                      className="font-mono text-sm"
                    />
                  </TooltipTrigger>
                  {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
                </Tooltip>
              </FormField>

              <FormField
                label="GEMINI MODEL"
                helper="Model used for plan generation and Gemini execution"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      {...register('geminiModel')}
                      placeholder="gemini-2.0-flash"
                      disabled={!editable}
                      className="font-mono text-sm"
                    />
                  </TooltipTrigger>
                  {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
                </Tooltip>
              </FormField>
            </div>

            {/* Claude Group */}
            <div className="border-line bg-surface-raised flex flex-col gap-4 rounded-md border p-4">
              <p className="text-fg-secondary font-mono text-xs tracking-widest uppercase">
                Anthropic Claude
              </p>

              <FormField
                label="CLAUDE API KEY"
                helper="Project-specific API key. Leave blank to use system default."
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      {...register('claudeApiKey')}
                      type="password"
                      placeholder="sk-ant-..."
                      disabled={!editable}
                      className="font-mono text-sm"
                    />
                  </TooltipTrigger>
                  {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
                </Tooltip>
              </FormField>

              <FormField label="EXECUTION MODEL" helper="Execution model for tasks">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      {...register('modelId')}
                      placeholder="claude-sonnet-4-6"
                      disabled={!editable}
                      className="font-mono text-sm"
                    />
                  </TooltipTrigger>
                  {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
                </Tooltip>
              </FormField>

              <FormField label="PLAN MODEL" helper="Model used for plan generation">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input
                      {...register('planModelId')}
                      placeholder="claude-opus-4-6"
                      disabled={!editable}
                      className="font-mono text-sm"
                    />
                  </TooltipTrigger>
                  {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
                </Tooltip>
              </FormField>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* EXECUTION LIMITS                                                     */}
        {/* ------------------------------------------------------------------ */}
        <section className="flex flex-col gap-4">
          <SectionHeading>EXECUTION LIMITS</SectionHeading>

          <FormField label="MAX CONCURRENT TASKS">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-4">
                  <Controller
                    name="maxConcurrentTasks"
                    control={control}
                    render={({ field }) => (
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={([v]) => field.onChange(v!)}
                        disabled={!editable}
                        className="flex-1"
                      />
                    )}
                  />
                  <span className="text-fg-secondary w-16 font-mono text-sm">
                    {watch('maxConcurrentTasks')} tasks
                  </span>
                </div>
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField
            label="TASK TIMEOUT (SECONDS)"
            helper={`Tasks will be killed after ${Math.round(watch('taskTimeoutSeconds') / 60)} minutes`}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  {...register('taskTimeoutSeconds', { valueAsNumber: true })}
                  type="number"
                  min={30}
                  max={3600}
                  disabled={!editable}
                  className="font-mono text-sm"
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField label="MAX RETRIES">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-4">
                  <Controller
                    name="maxRetriesPerTask"
                    control={control}
                    render={({ field }) => (
                      <Slider
                        min={0}
                        max={5}
                        step={1}
                        value={[field.value]}
                        onValueChange={([v]) => field.onChange(v!)}
                        disabled={!editable}
                        className="flex-1"
                      />
                    )}
                  />
                  <span className="text-fg-secondary w-16 font-mono text-sm">
                    {watch('maxRetriesPerTask')}
                  </span>
                </div>
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField label="RETRY DELAY">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Controller
                    name="retryDelaySeconds"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={String(field.value)}
                        onValueChange={(v) => field.onChange(parseInt(v, 10))}
                        disabled={!editable}
                      >
                        <SelectTrigger className="font-mono text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15s</SelectItem>
                          <SelectItem value="30">30s</SelectItem>
                          <SelectItem value="60">1 min</SelectItem>
                          <SelectItem value="300">5 min</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField label="MAX DIFF SIZE (KB)">
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  {...register('maxDiffSizeKb', { valueAsNumber: true })}
                  type="number"
                  min={1}
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

          <FormField label="TEST COMMAND">
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  {...register('testCommand')}
                  placeholder="pnpm test"
                  disabled={!editable}
                  className="font-mono text-sm"
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField label="LINT COMMAND">
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  {...register('lintCommand')}
                  placeholder="pnpm lint"
                  disabled={!editable}
                  className="font-mono text-sm"
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField label="SETUP COMMAND">
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  {...register('setupCommand')}
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

          <FormField label="BRANCH PREFIX">
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  {...register('branchPrefix')}
                  placeholder="daemon"
                  disabled={!editable}
                  className="font-mono text-sm"
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField label="COMMIT PREFIX">
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  {...register('commitMessagePrefix')}
                  placeholder="feat"
                  disabled={!editable}
                  className="font-mono text-sm"
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <div className="flex items-center justify-between">
            <Label className="text-fg-secondary font-mono text-xs uppercase">
              AUTO-CREATE PULL REQUESTS
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Controller
                    name="prAutoCreate"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!editable}
                      />
                    )}
                  />
                </div>
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </div>

          <FormField label="PR TARGET BRANCH">
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  {...register('prTargetBranch')}
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
            <Label className="text-fg-secondary font-mono text-xs uppercase">
              REQUIRE PLAN APPROVAL
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Switch
                    checked={currentRequireApproval}
                    onCheckedChange={handleRequireApprovalChange}
                    disabled={!editable}
                  />
                </div>
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-fg-secondary font-mono text-xs uppercase">
              AUTO-GENERATE PLAN ON SPEC SAVE
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center">
                  <Controller
                    name="autoGeneratePlan"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!editable}
                      />
                    )}
                  />
                </div>
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
            helper="Type a glob pattern and press Enter or comma to add. Leave empty to allow all files."
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Controller
                    name="allowedFileGlobs"
                    control={control}
                    render={({ field }) => (
                      <GlobTagInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!editable}
                        placeholder="src/**/*.ts"
                      />
                    )}
                  />
                </div>
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField
            label="FORBIDDEN FILE GLOBS"
            helper="Files matching these patterns will never be touched by the agent."
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Controller
                    name="forbiddenFileGlobs"
                    control={control}
                    render={({ field }) => (
                      <GlobTagInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!editable}
                        placeholder="**/*.env"
                      />
                    )}
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

          <div className="border-line bg-surface-raised rounded-md border p-4">
            <p className="text-fg-muted font-mono text-xs tracking-widest uppercase">AGENT TOKEN</p>
            <p className="text-fg mt-2 font-mono text-sm">sdk_••••••••••••</p>
            <p className="text-fg-muted mt-1 text-xs">
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
                <Button type="submit" disabled={!editable || isSubmitting || !isDirty} size="sm">
                  {isSubmitting ? 'Saving…' : 'Save Configuration'}
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
