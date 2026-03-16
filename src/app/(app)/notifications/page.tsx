'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
import { Button } from '@/components/ui/button';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { cn } from '@/lib/utils';

interface Notification {
  id: number;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
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

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'mentions', label: 'Mentions' },
] as const;

type TabValue = (typeof STATUS_TABS)[number]['value'];

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<TabValue>('all');

  const url =
    tab === 'unread'
      ? `/api/v1/notifications?unread=true&page=${page}`
      : tab === 'mentions'
        ? `/api/v1/notifications?type=mention&page=${page}`
        : `/api/v1/notifications?page=${page}`;

  const { data, isLoading, restart } = usePolling<NotificationsPageResponse>({
    url,
    interval: 30_000,
  });

  const list: Notification[] = (data?.notifications ??
    (data as unknown as Notification[]) ??
    []) as Notification[];
  const meta = data?.meta ?? { page: 1, total: 0 };
  const totalPages = Math.max(1, Math.ceil(meta.total / 50));
  const unreadCount = meta?.unread ?? list.filter((n) => !n.readAt).length;

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
    <div className="-mx-6 -mt-6 flex min-h-full flex-col">
      {/* Header */}
      <div className="border-border-default flex items-center justify-between border-b px-6 py-4">
        <div>
          <div className="text-muted-foreground mb-1 font-mono text-[10px] tracking-[0.2em] uppercase">
            Notifications
          </div>
          <h1 className="text-foreground text-xl font-semibold">All Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="border-border-default flex items-center gap-1 border-b px-6 py-3">
        {STATUS_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              setTab(value);
              setPage(1);
            }}
            className={cn(
              'h-7 rounded px-2.5 font-mono text-[10px] tracking-wider uppercase transition-colors',
              tab === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
            {value === 'unread' && unreadCount > 0 && (
              <span className="ml-1 opacity-70">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col">
        {isLoading && list.length === 0 && (
          <div className="text-muted-foreground py-8 text-center font-mono text-xs">Loading…</div>
        )}

        {!isLoading && list.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16">
            <DaemonMascot size={48} expression="idle" />
            <p className="text-muted-foreground font-mono text-sm">All caught up.</p>
          </div>
        )}

        {list.map((n) => (
          <div
            key={n.id}
            className={cn(
              'border-border-default/50 flex items-center gap-4 border-b py-3 pr-6 transition-colors',
              !n.readAt
                ? 'border-l-accent-violet bg-accent-violet/5 border-l-2 pl-[22px]'
                : 'hover:bg-bg-elevated/50 border-l-2 border-l-transparent pl-[22px]'
            )}
          >
            {/* Icon */}
            <div className="shrink-0">
              <DaemonMascot size={28} expression={!n.readAt ? 'working' : 'idle'} />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'text-sm leading-snug',
                  !n.readAt ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
              >
                {n.title}
              </p>
              <p className="text-muted-foreground mt-0.5 font-mono text-[10px]">
                {formatRelativeTime(n.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 px-6 py-4">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span className="text-muted-foreground font-mono text-xs">
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
      )}
    </div>
  );
}
