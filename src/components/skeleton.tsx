import { cn } from '@/lib/utils';

/**
 * Skeleton component - used to show loading state while content is being fetched.
 *
 * This component emits a shimmer animation to indicate loading progress.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-status-idle-10', className)}
      {...props}
    />
  );
}

/**
 * Card skeleton - mimics a card layout with avatar and content
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-bg-elevated border border-border-default rounded-[8px] p-4', className)}>
      <div className="flex gap-4">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

/**
 * Table skeleton - for tabular data
 */
export function TableSkeleton({ rows = 5, columns = 3 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-2 bg-bg-elevated border border-border-default rounded-[8px]">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn(
                'h-4',
                colIndex === 0 ? 'w-16' : colIndex === 1 ? 'flex-1' : 'w-32'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Kanban column skeleton
 */
export function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {['To Do', 'In Progress', 'Done', 'Blocked'].map((status) => (
        <div key={status} className="bg-bg-elevated border border-border-default rounded-[8px] p-4 h-96">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-8 rounded-full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Task card skeleton
 */
export function TaskCardSkeleton() {
  return (
    <div className="bg-bg-elevated border border-border-default rounded-[8px] p-4">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-5 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Log entry skeleton
 */
export function LogSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-bg-elevated border border-border-default rounded-[8px] p-3">
          <div className="flex items-start gap-3">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Project item skeleton - for sidebar
 */
export function ProjectItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-bg-elevated border border-border-default rounded-[8px] rounded-[8px] mb-2">
      <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

/**
 * Avatar skeleton
 */
export function AvatarSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return <Skeleton className={cn('rounded-full', sizeClasses[size])} />;
}

/**
 * Button skeleton
 */
export function ButtonSkeleton({ width = 'w-24' }: { width?: string }) {
  return <Skeleton className={cn('h-10 rounded-lg', width)} />;
}

/**
 * Input skeleton
 */
export function InputSkeleton() {
  return <Skeleton className="h-10 w-full rounded-lg" />;
}
