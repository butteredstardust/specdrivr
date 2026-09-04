'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormField, SectionHeading, type FormValues } from './shared';

export function LimitsSection({ editable }: { editable: boolean }) {
  const { register, control, watch } = useFormContext<FormValues>();

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading>Execution limits</SectionHeading>

      <FormField label="Max concurrent tasks">
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

      <FormField label="Max retries">
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

      <FormField label="Retry delay">
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
  );
}
