import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * EntityId — renders a domain identifier (T-042, SPEC-003, SES-0091).
 *
 * Per DESIGN_SYSTEM.md §3.3, IDs are reference data, not calls to action, so
 * they render mono at `text-fg-secondary`. Before the overhaul they were amber,
 * which read as a second accent and competed with genuine warning states.
 */
export interface EntityIdProps extends React.HTMLAttributes<HTMLElement> {
  /** Renders a subtle chip background. Use in dense rows to aid scanning. */
  chip?: boolean;
}

export function EntityId({ chip = false, className, children, ...props }: EntityIdProps) {
  return (
    <code
      data-slot="entity-id"
      className={cn(
        'text-fg-secondary shrink-0 font-mono text-xs whitespace-nowrap',
        chip && 'bg-surface-inset border-line rounded-sm border px-1.5 py-0.5',
        className
      )}
      {...props}
    >
      {children}
    </code>
  );
}
