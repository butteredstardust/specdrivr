import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const pixelBadgeVariants = cva(
  'font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded inline-flex items-center gap-1.5',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-muted-foreground',
        amber: 'bg-phosphor-amber/10 text-phosphor-amber',
        primary: 'bg-primary/10 text-primary',
        emerald: 'bg-status-emerald/10 text-status-emerald',
        red: 'bg-status-red/10 text-status-red',
        violet: 'bg-accent-violet/10 text-accent-violet',
        muted: 'bg-secondary text-muted-foreground opacity-60',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface PixelBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pixelBadgeVariants> {
  dot?: boolean;
  dotClassName?: string;
}

export function PixelBadge({ className, variant, dot, dotClassName, children, ...props }: PixelBadgeProps) {
  return (
    <span className={cn(pixelBadgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span 
          className={cn(
            'h-1.5 w-1.5 rounded-full shrink-0',
            variant === 'violet' && 'bg-accent-violet animate-pulse',
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
