'use client';

import { Controller, useFormContext } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormField, SectionHeading, type FormValues } from './shared';

export function ProvidersSection({ editable }: { editable: boolean }) {
  const { register, control } = useFormContext<FormValues>();

  return (
    <section className="border-line bg-surface-raised flex flex-col gap-4 rounded-lg border p-6">
      <SectionHeading>AI providers</SectionHeading>

      <FormField
        label="Execution backend"
        htmlFor="agent-backend"
        helper="Which AI agent executes your tasks. Both require the respective CLI installed on the agent machine."
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full">
              <Controller
                name="backend"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!editable}>
                    <SelectTrigger id="agent-backend" className="text-sm">
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
        <div className="border-line bg-surface-sunken flex flex-col gap-4 rounded-lg border p-4">
          <p className="text-fg-secondary text-xs">Google Gemini</p>

          <FormField
            label="Gemini API key"
            htmlFor="gemini-api-key"
            helper="Project-specific API key. Leave blank to use system default."
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="gemini-api-key"
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
            label="Gemini model"
            htmlFor="gemini-model"
            helper="Model used for plan generation and Gemini execution"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="gemini-model"
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
        <div className="border-line bg-surface-sunken flex flex-col gap-4 rounded-lg border p-4">
          <p className="text-fg-secondary text-xs">Anthropic Claude</p>

          <FormField
            label="Claude API key"
            htmlFor="claude-api-key"
            helper="Project-specific API key. Leave blank to use system default."
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="claude-api-key"
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

          <FormField
            label="Execution model"
            htmlFor="execution-model"
            helper="Execution model for tasks"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="execution-model"
                  {...register('modelId')}
                  placeholder="claude-sonnet-4-6"
                  disabled={!editable}
                  className="font-mono text-sm"
                />
              </TooltipTrigger>
              {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
            </Tooltip>
          </FormField>

          <FormField
            label="Plan model"
            htmlFor="plan-model"
            helper="Model used for plan generation"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Input
                  id="plan-model"
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
  );
}
