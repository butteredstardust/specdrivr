import { Skeleton } from '@/components/skeleton';

export default function CommitsLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <header className="sticky top-0 z-30 h-[56px] bg-[var(--brand-primary)] border-b border-[var(--border-default)]">
        <div className="max-w-7xl mx-auto px-[var(--sp-4)] md:px-[var(--sp-6)] py-[var(--sp-3)]">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <div className="flex items-center gap-[var(--sp-3)]">
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        <aside className="w-[240px] flex-shrink-0 border-r border-[var(--border-default)] bg-[var(--bg-surface)] overflow-y-auto p-[var(--sp-4)]">
          <Skeleton className="h-8 w-32 mb-[var(--sp-4)]" />
          <div className="space-y-[var(--sp-2)]">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-[var(--bg-page)]">
          <div className="px-[var(--sp-6)] py-[var(--sp-4)] bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
            <Skeleton className="h-8 w-48 mb-[var(--sp-2)]" />
            <Skeleton className="h-5 w-64" />
          </div>

          <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-[var(--sp-6)] py-[var(--sp-3)]">
            <div className="flex gap-[var(--sp-2)]">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-20" />
              ))}
            </div>
          </div>

          <div className="px-[var(--sp-6)] py-[var(--sp-6)] space-y-[var(--sp-3)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
