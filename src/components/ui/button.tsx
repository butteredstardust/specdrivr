import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Button
 *
 * Variants are semantic. The pre-overhaul `phosphor` (amber mono) and `blue`
 * (cyan mono) variants are gone — they were a second and third accent wearing
 * a terminal costume. Their call sites map to `warning` and `info`.
 *
 * Focus is deliberately NOT styled here: `:focus-visible` is set once globally
 * in globals.css so every interactive element in the app matches.
 */
const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md',
    'text-sm font-medium transition-colors duration-[120ms]',
    'disabled:pointer-events-none disabled:opacity-50',
    'aria-disabled:pointer-events-none aria-disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        default: 'bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active',
        destructive: 'bg-danger text-fg-inverse hover:bg-danger/90',
        outline: 'border-line bg-surface-raised text-fg hover:bg-surface-inset border',
        secondary: 'bg-surface-inset text-fg hover:bg-surface-sunken',
        ghost: 'text-fg-secondary hover:bg-surface-inset hover:text-fg',
        link: 'text-accent underline-offset-4 hover:underline',
        warning: 'border-warning-border bg-warning-bg text-warning hover:bg-warning-bg/70 border',
        info: 'border-info-border bg-info-bg text-info hover:bg-info-bg/70 border',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-6',
        icon: 'size-9',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
