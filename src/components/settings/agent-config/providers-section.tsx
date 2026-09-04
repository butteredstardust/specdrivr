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
    <section className="flex flex-col gap-4">
      <SectionHeading>AI providers</SectionHeading>

      <FormField
        label="Execution backend"
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
                    <SelectTrigger className="text-sm">
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
          <p className="text-fg-secondary text-xs">Google Gemini</p>

          <FormField
            label="Gemini API key"
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
            label="Gemini model"
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
          <p className="text-fg-secondary text-xs">Anthropic Claude</p>

          <FormField
            label="Claude API key"
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

          <FormField label="Execution model" helper="Execution model for tasks">
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

          <FormField label="Plan model" helper="Model used for plan generation">
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
  );
}
