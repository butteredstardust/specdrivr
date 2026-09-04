import * as React from 'react';

import { cn } from '@/lib/utils';

/** Textarea. Mirrors Input's surface, border, and invalid handling exactly. */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        data-slot="textarea"
        className={cn(
          'border-line bg-surface-base text-fg placeholder:text-fg-muted',
          'flex min-h-16 w-full rounded-md border px-3 py-2 text-sm',
          'transition-colors duration-[120ms]',
          'focus:border-accent',
          'disabled:bg-surface-inset disabled:cursor-not-allowed disabled:opacity-50',
          'aria-invalid:border-danger',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
