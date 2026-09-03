import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const pixelBadgeVariants = cva(
  'font-mono text-[9px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-sm inline-flex items-center gap-1.5 border transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-muted-foreground border-border-default shadow-sm',
        amber:
          'bg-phosphor-amber/10 text-phosphor-amber border-phosphor-amber/30 shadow-[0_0_8px_rgba(245,158,11,0.1)]',
        primary: 'bg-primary/10 text-primary border-primary/30 shadow-sm',
        emerald:
          'bg-status-emerald/10 text-status-emerald border-status-emerald/30 shadow-[0_0_8px_rgba(16,185,129,0.1)]',
        red: 'bg-status-red/10 text-status-red border-status-red/30 shadow-[0_0_8px_rgba(239,68,68,0.1)]',
        blue: 'bg-accent-blue/10 text-accent-blue border-accent-blue/30 shadow-sm',
        muted: 'bg-secondary/50 text-text-muted border-border-muted opacity-80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface PixelBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof pixelBadgeVariants> {
  dot?: boolean;
  dotClassName?: string;
}

export function PixelBadge({
  className,
  variant,
  dot,
  dotClassName,
  children,
  ...props
}: PixelBadgeProps) {
  return (
    <span className={cn(pixelBadgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full',
            variant === 'blue' && 'bg-accent-blue animate-pulse',
            variant === 'amber' && 'bg-phosphor-amber',
            variant === 'emerald' && 'bg-status-emerald',
            variant === 'red' && 'bg-status-red',
            variant === 'default' && 'bg-muted-foreground',
            dotClassName
          )}
        />
      )}
      {children}
    </span>
  );
}
