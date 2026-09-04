import { cn } from '@/lib/utils';

/**
 * Skeleton
 *
 * Uses the inset surface at full opacity. It was previously
 * `bg-surface-inset/10`, which on the raised surface it usually sits on was
 * close to invisible — the loading state read as an empty page.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-surface-inset animate-pulse-subtle rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
