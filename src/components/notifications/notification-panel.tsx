'use client';

import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import { usePolling } from '@/hooks/use-polling';
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

interface NotificationsResponse {
  notifications?: Notification[];
  meta?: { total: number; unread?: number };
}

function formatRelativeTime(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
}

export function NotificationPanel() {
  const { data, isLoading, restart } = usePolling<NotificationsResponse>({
    url: '/api/v1/notifications?limit=5',
    interval: 30_000,
  });

  // usePolling unwraps the { data: T } envelope, so data here is the inner payload.
  // The API may return { notifications: [...], meta: {...} } or the array directly.
  const list: Notification[] = (data?.notifications ?? (data as unknown as Notification[]) ?? []) as Notification[];
  const hasUnread = list.some((n) => !n.isRead);

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
      <div className="flex items-center justify-between px-4 py-3 border-b border-[--border-default]">
        <span className="font-mono text-xs font-semibold tracking-widest uppercase text-[--text-muted]">
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
            <span className="font-mono text-xs text-[--text-muted]">Nothing to report.</span>
          </div>
        )}
        {isLoading && list.length === 0 && (
          <div className="py-6 text-center font-mono text-xs text-[--text-muted]">Loading...</div>
        )}
        {list.slice(0, 5).map((n) => (
          <div
            key={n.id}
            className={cn(
              'flex h-12 items-center gap-3 px-4 border-b border-[--border-default] last:border-0',
              !n.isRead
                ? 'bg-[--accent-violet]/5 border-l-2 border-[--accent-violet]'
                : 'border-l-2 border-transparent'
            )}
          >
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm text-[--text-primary]">{n.message}</p>
            </div>
            <span className="shrink-0 font-mono text-xs text-[--text-muted]">
              {formatRelativeTime(n.createdAt)}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-[--border-default] px-4 py-2">
        <a
          href="/notifications"
          className="font-mono text-xs text-[--accent-violet] hover:underline"
        >
          View all notifications &rarr;
        </a>
      </div>
    </div>
  );
}
