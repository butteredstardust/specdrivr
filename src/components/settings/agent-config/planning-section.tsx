'use client';

import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
import { SectionHeading, type FormValues } from './shared';

export function PlanningSection({ editable }: { editable: boolean }) {
  const { control, watch, setValue } = useFormContext<FormValues>();

  // The confirmation dialog belongs to the only switch that opens it, rather
  // than to the whole form as it did before the split.
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const requireApproval = watch('requireApproval');

  const handleRequireApprovalChange = (checked: boolean) => {
    if (!checked && requireApproval) {
      setApprovalDialogOpen(true);
      return;
    }
    setValue('requireApproval', checked, { shouldDirty: true });
  };

  return (
    <>
      <section className="flex flex-col gap-4">
        <SectionHeading>Planning</SectionHeading>

        <div className="flex items-center justify-between">
          <Label className="text-fg-secondary text-xs">Require plan approval</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <Switch
                  checked={requireApproval}
                  onCheckedChange={handleRequireApprovalChange}
                  disabled={!editable}
                />
              </div>
            </TooltipTrigger>
            {!editable && <TooltipContent>Requires Admin or Owner role</TooltipContent>}
          </Tooltip>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-fg-secondary text-xs">Auto-generate plan on spec save</Label>
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

      <AlertDialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable plan approval?</AlertDialogTitle>
            <AlertDialogDescription>
              Disabling plan approval means sessions will start automatically. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setValue('requireApproval', false, { shouldDirty: true });
                setApprovalDialogOpen(false);
              }}
            >
              Disable approval
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
