'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GlobTagInput, FormField, SectionHeading, type FormValues } from './shared';

export function BoundariesSection({ editable }: { editable: boolean }) {
  const { control } = useFormContext<FormValues>();

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading>File boundaries</SectionHeading>

      <FormField
        label="Allowed file globs"
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
        label="Forbidden file globs"
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
  );
}
