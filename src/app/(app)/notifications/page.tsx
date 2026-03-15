'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { cn } from '@/lib/utils';

interface Notification {
  id: number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsPageResponse {
  notifications?: Notification[];
  meta?: { page: number; total: number; unread?: number };
}

function formatRelativeTime(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'all' | 'unread'>('all');

  const url =
    tab === 'unread'
      ? `/api/v1/notifications?unread=true&page=${page}`
      : `/api/v1/notifications?page=${page}`;

  const { data, isLoading, restart } = usePolling<NotificationsPageResponse>({
    url,
    interval: 30_000,
  });

  // usePolling unwraps the { data: T } envelope automatically.
  const list: Notification[] = (data?.notifications ?? (data as unknown as Notification[]) ?? []) as Notification[];
  const meta = data?.meta ?? { page: 1, total: 0 };
  const totalPages = Math.max(1, Math.ceil(meta.total / 50));
  const unreadCount = meta?.unread ?? list.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/v1/notifications/read-all', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      restart();
      toast.success('All notifications marked as read.');
    } catch (err) {
      clientLogger.error('NotificationsPage: mark all read failed', err);
      toast.error('Failed to mark notifications as read.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">
          NOTIFICATIONS
        </h1>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as typeof tab);
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading && list.length === 0 && (
            <p className="font-mono text-xs text-[--text-muted]">Loading...</p>
          )}
          {!isLoading && list.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-16">
              <DaemonMascot size={48} expression="idle" />
              <p className="font-mono text-sm text-[--text-secondary]">All caught up.</p>
            </div>
          )}
          {list.length > 0 && (
            <div className="space-y-1">
              {list.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'flex h-14 items-center gap-4 rounded-sm px-4',
                    !n.isRead
                      ? 'bg-[--accent-violet]/5 border-l-2 border-[--accent-violet]'
                      : 'border-l-2 border-transparent hover:bg-[--bg-elevated]'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-[--text-primary]">{n.message}</p>
                    <p className="font-mono text-xs text-[--text-muted]">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded bg-[--bg-elevated] px-2 py-0.5 font-mono text-xs text-[--text-muted]">
                    {n.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span className="font-mono text-xs text-[--text-muted]">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
    </div>
  );
}
