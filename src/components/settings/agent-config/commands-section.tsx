'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FormField, SectionHeading, type FormValues } from './shared';

export function CommandsSection({ editable }: { editable: boolean }) {
  const { register } = useFormContext<FormValues>();

  return (
    <section className="border-line bg-surface-raised flex flex-col gap-4 rounded-lg border p-6">
      <SectionHeading>Execution commands</SectionHeading>

      <FormField label="Test command" htmlFor="test-command">
        <Tooltip>
          <TooltipTrigger asChild>
            <Input
              id="test-command"
              {...register('testCommand')}
              placeholder="pnpm test"
              disabled={!editable}
              className="font-mono text-sm"
            />
          </TooltipTrigger>
          {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
        </Tooltip>
      </FormField>

      <FormField label="Lint command" htmlFor="lint-command">
        <Tooltip>
          <TooltipTrigger asChild>
            <Input
              id="lint-command"
              {...register('lintCommand')}
              placeholder="pnpm lint"
              disabled={!editable}
              className="font-mono text-sm"
            />
          </TooltipTrigger>
          {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
        </Tooltip>
      </FormField>

      <FormField label="Setup command" htmlFor="setup-command">
        <Tooltip>
          <TooltipTrigger asChild>
            <Input
              id="setup-command"
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
  );
}
