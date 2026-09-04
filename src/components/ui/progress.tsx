'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/utils';

/**
 * Progress
 *
 * The only progress affordance in the system. The retro `ASCIIProgress`
 * (a ▓▒ bar rendered in mono) was removed in the 2026-09-04 overhaul — see
 * UI_SPEC.md §13. Its three call sites now use this bar, which is legible at
 * a glance, animates, and reports itself to assistive tech via Radix.
 *
 * `value` is a percentage (0–100), matching the Radix contract.
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    data-slot="progress"
    className={cn('bg-surface-inset relative h-1.5 w-full overflow-hidden rounded-full', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className="bg-accent h-full w-full flex-1 transition-transform duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
