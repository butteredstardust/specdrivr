'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface GatedButtonProps extends React.ComponentProps<typeof Button> {
  /** When false the button renders disabled and explains itself on hover/focus. */
  allowed: boolean;
  /** Tooltip text shown when `allowed` is false, e.g. "Requires Admin role". */
  reason: string;
}

/**
 * A permission-gated button that explains its own disabled state.
 *
 * Every role-restricted action used to be written twice — once enabled, once
 * wrapped in a tooltip with `disabled aria-disabled` — which is most of why the
 * plan tab and the task drawer ran to hundreds of lines. A disabled button
 * fires no pointer events, so the tooltip needs a focusable wrapper to hang
 * off; that detail lives here now instead of at a dozen call sites.
 *
 * Requires an ancestor `TooltipProvider`.
 */
export function GatedButton({ allowed, reason, children, ...props }: GatedButtonProps) {
  if (allowed) {
    return <Button {...props}>{children}</Button>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>
          <Button {...props} disabled aria-disabled>
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}
