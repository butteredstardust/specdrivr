import { Skeleton } from '@/components/skeleton';

export default function SettingsPageLoading() {
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
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>

          {/* Tabs */}
          <div className="border-b border-border-default bg-bg-elevated px-6 py-3">
            <div className="flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-20" />
              ))}
            </div>
          </div>

          {/* Settings Content Skeleton */}
          <div className="px-6 py-6">
            <div className="max-w-3xl space-y-6">
              {/* Project Info Section */}
              <div className="bg-bg-elevated border border-border-default rounded-[8px] p-6">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>

              {/* Git Integration Section */}
              <div className="bg-bg-elevated border border-border-default rounded-[8px] p-6">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <div className="flex gap-4">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 flex-1" />
                  </div>
                </div>
              </div>

              {/* Agent Tokens Section */}
              <div className="bg-bg-elevated border border-border-default rounded-[8px] p-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-10 w-24" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
