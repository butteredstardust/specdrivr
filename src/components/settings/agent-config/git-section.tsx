'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormField, SectionHeading, type FormValues } from './shared';

export function GitSection({ editable }: { editable: boolean }) {
  const { register, control } = useFormContext<FormValues>();

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading>Git settings</SectionHeading>

      <FormField label="Branch prefix">
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

      <FormField label="Commit prefix">
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
        <Label className="text-fg-secondary text-xs">AUTO-CREATE PULL REQUESTS</Label>
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

      <FormField label="PR target branch">
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
  );
}
