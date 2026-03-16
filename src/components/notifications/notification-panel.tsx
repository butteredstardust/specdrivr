'use client';

import { toast } from 'sonner';
import Link from 'next/link';
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

interface NotificationsResponse {
  notifications?: Notification[];
  meta?: { total: number; unread?: number };
}

function formatRelativeTime(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function NotificationPanel() {
  const { data, isLoading, restart } = usePolling<NotificationsResponse>({
    url: '/api/v1/notifications?limit=5',
    interval: 30_000,
  });

  // usePolling unwraps the { data: T } envelope, so data here is the inner payload.
  // The API may return { notifications: [...], meta: {...} } or the array directly.
  const list: Notification[] = (data?.notifications ??
    (data as unknown as Notification[]) ??
    []) as Notification[];
  const hasUnread = list.some((n) => !n.readAt);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/v1/notifications/read-all', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      restart();
    } catch (err) {
      clientLogger.error('NotificationPanel: mark all read failed', err);
      toast.error('Failed to mark notifications as read.');
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-border-default flex items-center justify-between border-b px-4 py-3">
        <span className="text-text-muted font-mono text-xs font-semibold tracking-widest uppercase">
          NOTIFICATIONS
        </span>
        {hasUnread && (
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {/* List */}
      <div className="flex flex-col">
        {list.length === 0 && !isLoading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <DaemonMascot size={32} expression="idle" />
            <span className="text-text-muted font-mono text-xs">Nothing to report.</span>
          </div>
        )}
        {isLoading && list.length === 0 && (
          <div className="text-text-muted py-6 text-center font-mono text-xs">Loading...</div>
        )}
        {list.slice(0, 5).map((n) => (
          <div
            key={n.id}
            className={cn(
              'border-border-default flex items-center gap-3 border-b px-4 py-3 transition-colors last:border-0',
              !n.readAt ? 'bg-accent-violet/5' : 'hover:bg-bg-elevated/50'
            )}
          >
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'truncate text-sm',
                  !n.readAt ? 'text-text-primary font-medium' : 'text-text-secondary'
                )}
              >
                {n.title}
              </p>
            </div>
            <span className="text-text-muted shrink-0 font-mono text-[10px]">
              {formatRelativeTime(n.createdAt)}
            </span>
            {!n.readAt && <div className="bg-accent-violet h-1.5 w-1.5 shrink-0 rounded-full" />}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-border-default border-t px-4 py-2.5">
        <Link
          href="/notifications"
          className="text-accent-violet hover:text-accent-violet-dim font-mono text-xs transition-colors hover:underline"
        >
          View all notifications &rarr;
        </Link>
      </div>
    </div>
  );
}
