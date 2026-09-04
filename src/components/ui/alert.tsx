import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Alert — a persistent inline message attached to a region of the page.
 *
 * For transient feedback use a toast (`sonner`) instead; for a blocking
 * decision use AlertDialog.
 *
 * Variants match the status vocabulary shared with Badge and StatusIcon, so a
 * warning is the same amber everywhere. The stock shadcn `destructive`
 * variant is kept as an alias of `danger` so existing call sites still work.
 */
const alertVariants = cva(
  [
    'relative grid w-full grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 rounded-lg border px-4 py-3 text-sm',
    'has-[>svg]:grid-cols-[auto_1fr] [&>svg]:mt-0.5 [&>svg]:size-4',
  ],
  {
    variants: {
      variant: {
        default: 'bg-surface-raised border-line text-fg [&>svg]:text-fg-muted',
        info: 'bg-info-bg border-info-border text-fg [&>svg]:text-info',
        success: 'bg-success-bg border-success-border text-fg [&>svg]:text-success',
        warning: 'bg-warning-bg border-warning-border text-fg [&>svg]:text-warning',
        danger: 'bg-danger-bg border-danger-border text-fg [&>svg]:text-danger',
        destructive: 'bg-danger-bg border-danger-border text-fg [&>svg]:text-danger',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="alert"
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      data-slot="alert-title"
      className={cn('col-start-2 leading-tight font-medium', className)}
      {...props}
    />
  )
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="alert-description"
    className={cn('text-fg-secondary col-start-2 text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription, alertVariants };
