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
    <section className="border-line bg-surface-raised flex flex-col gap-4 rounded-lg border p-6">
      <SectionHeading>Git settings</SectionHeading>

      <FormField label="Branch prefix" htmlFor="branch-prefix">
        <Tooltip>
          <TooltipTrigger asChild>
            <Input
              id="branch-prefix"
              {...register('branchPrefix')}
              placeholder="daemon"
              disabled={!editable}
              className="font-mono text-sm"
            />
          </TooltipTrigger>
          {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
        </Tooltip>
      </FormField>

      <FormField label="Commit prefix" htmlFor="commit-prefix">
        <Tooltip>
          <TooltipTrigger asChild>
            <Input
              id="commit-prefix"
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
        <Label htmlFor="auto-create-prs" className="text-fg-secondary text-xs">
          Auto-create pull requests
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <Controller
                name="prAutoCreate"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="auto-create-prs"
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

      <FormField label="PR target branch" htmlFor="pr-target-branch">
        <Tooltip>
          <TooltipTrigger asChild>
            <Input
              id="pr-target-branch"
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
