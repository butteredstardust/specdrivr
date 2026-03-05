import { Skeleton } from '@/components/skeleton';

export default function CommitsPageLoading() {
  return (
    <div className="min-h-screen bg-bg-primary ">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-30 ios-header border-b border-border-default">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </header>

      {/* Main Layout Skeleton */}
      <div className="flex h-[calc(100vh-57px)]">
        {/* Sidebar Skeleton */}
        <aside className="w-60 flex-shrink-0 border-r border-border-default bg-bg-elevated linear-scrollbar overflow-y-auto p-4">
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <main className="flex-1 overflow-y-auto linear-scrollbar bg-bg-primary">
          {/* Project Title Section */}
          <div className="px-6 py-4 bg-bg-elevated border-b border-border-default">
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>

          {/* Tabs */}
          <div className="border-b border-border-default bg-bg-elevated px-6 py-3">
            <div className="flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-20" />
              ))}
            </div>
          </div>

          {/* Commits Content Skeleton */}
          <div className="px-6 py-6">
            <div className="max-w-4xl">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>

              {/* Commit Cards Skeleton */}
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
