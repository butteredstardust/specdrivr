import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge — compact status and metadata label.
 *
 * Replaces the pre-overhaul `pixel-badge`. Variants are named for meaning
 * (success/warning/danger/info) rather than for colour (emerald/amber/red/blue),
 * so a token change never leaves a variant name lying about what it shows.
 *
 * Per DESIGN_SYSTEM.md §8.4, status is never colour-only: pair a badge with a
 * glyph, or use `dot` for live states, or rely on the label text itself.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-2xs uppercase tracking-[0.08em] whitespace-nowrap transition-colors',
  {
    variants: {
      variant: {
        neutral: 'border-line bg-surface-inset text-fg-secondary',
        muted: 'border-line-subtle bg-surface-inset text-fg-muted',
        accent: 'border-accent-border bg-accent-subtle text-accent',
        info: 'border-info-border bg-info-bg text-info',
        success: 'border-success-border bg-success-bg text-success',
        warning: 'border-warning-border bg-warning-bg text-warning',
        danger: 'border-danger-border bg-danger-bg text-danger',
        outline: 'border-line bg-transparent text-fg-secondary',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

const dotVariants = cva('size-1.5 shrink-0 rounded-full', {
  variants: {
    variant: {
      neutral: 'bg-fg-muted',
      muted: 'bg-fg-muted',
      accent: 'bg-surface-inset',
      info: 'bg-info animate-pulse-subtle',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-danger',
      outline: 'bg-fg-muted',
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /** Renders a leading dot. `info` pulses, to mark genuinely live activity. */
  dot?: boolean;
  dotClassName?: string;
}

export function Badge({ className, variant, dot, dotClassName, children, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span data-slot="badge-dot" className={cn(dotVariants({ variant }), dotClassName)} />}
      {children}
    </span>
  );
}

export { badgeVariants };
