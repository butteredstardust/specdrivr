import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Input
 *
 * Focus is not styled here — `:focus-visible` in globals.css draws one ring
 * for the whole app. The border does shift to accent on focus, which is a
 * colour cue layered on top of the outline, not a replacement for it.
 *
 * `aria-invalid` drives the error appearance, so form code sets one attribute
 * rather than juggling className strings.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          'border-line bg-surface-base text-fg placeholder:text-fg-muted',
          'flex h-9 w-full rounded-md border px-3 py-1 text-sm',
          'transition-colors duration-[120ms]',
          'focus:border-accent',
          'file:text-fg file:border-0 file:bg-transparent file:text-sm file:font-medium',
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
Input.displayName = 'Input';

export { Input };
