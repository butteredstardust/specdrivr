'use client';

import { useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import type { UserRole } from '@/db/schema';
import type { PublicAgentConfig } from '@/lib/agent-config-public';
import { usePolling } from '@/hooks/use-polling';
import { GatedButton } from '@/components/ui/gated-button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { agentConfigFormSchema } from '@/lib/schemas';
import { updateAgentConfigAction } from '@/actions/settings';
import { canEdit, DEFAULTS, type FormValues } from './agent-config/shared';
import { ProvidersSection } from './agent-config/providers-section';
import { LimitsSection } from './agent-config/limits-section';
import { CommandsSection } from './agent-config/commands-section';
import { GitSection } from './agent-config/git-section';
import { PlanningSection } from './agent-config/planning-section';
import { BoundariesSection } from './agent-config/boundaries-section';
import { TokenSection } from './agent-config/token-section';

interface AgentConfigFormProps {
  projectId: number;
  userRole: UserRole;
}

// ---------------------------------------------------------------------------
// AgentConfigForm — composition root
//
// Owns the form instance, the one-shot config load, and the save. Every field
// lives in a section under `agent-config/`, reaching the form through
// `useFormContext` rather than through props, so adding a field to a section
// never touches this file.
// ---------------------------------------------------------------------------

export function AgentConfigForm({ projectId, userRole }: AgentConfigFormProps) {
  const editable = canEdit(userRole);

  const methods = useForm({
    resolver: zodResolver(agentConfigFormSchema),
    defaultValues: DEFAULTS,
  });
  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = methods;

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

  if (isLoading) {
    return <p className="text-fg-secondary text-sm">Loading agent configuration…</p>;
  }

  return (
    <TooltipProvider>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex max-w-2xl flex-col gap-6">
          <ProvidersSection editable={editable} />
          <LimitsSection editable={editable} />
          <CommandsSection editable={editable} />
          <GitSection editable={editable} />
          <PlanningSection editable={editable} />
          <BoundariesSection editable={editable} />
          <TokenSection />

          <div>
            <GatedButton
              allowed={editable}
              reason="Requires Admin or Owner role"
              type="submit"
              disabled={isSubmitting || !isDirty}
              size="sm"
            >
              {isSubmitting ? 'Saving…' : 'Save configuration'}
            </GatedButton>
          </div>
        </form>
      </FormProvider>
    </TooltipProvider>
  );
}
