'use client';

import { useState } from 'react';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clientLogger } from '@/lib/logger-client';

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error' | 'mention';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  pages: number;
}

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'mentions', label: 'Mentions' },
] as const;

type TabValue = (typeof STATUS_TABS)[number]['value'];

export default function NotificationsPage() {
  const { activeProjectId } = useShell();
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<TabValue>('all');

  const buildFetchUrl = () => {
    const params = new URLSearchParams();
    if (activeProjectId) params.set('projectId', String(activeProjectId));
    params.set('page', String(page));
    params.set('limit', '50');
    if (tab === 'unread') params.set('unreadOnly', 'true');
    if (tab === 'mentions') params.set('type', 'mention');
    return `/api/v1/notifications?${params.toString()}`;
  };

  const notificationsUrl = buildFetchUrl();

  const { data, isLoading, restart } = usePolling<NotificationsResponse>({
    url: notificationsUrl,
    interval: 5000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const totalPages = data?.pages ?? 1;

  const handleMarkAllRead = async () => {
    if (!activeProjectId) return;
    try {
      const res = await fetch(`/api/v1/notifications/read-all?projectId=${activeProjectId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) restart();
    } catch (error) {
      clientLogger.error('Failed to mark all notifications as read', { error });
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/notifications/${id}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) restart();
    } catch (error) {
      clientLogger.error('Failed to mark notification as read', { error, notificationId: id });
    }
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="text-status-emerald h-4 w-4" />;
      case 'error':
        return <AlertCircle className="text-status-red h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="text-phosphor-amber h-4 w-4" />;
      case 'mention':
        return <Bell className="text-accent-violet h-4 w-4" />;
      default:
        return <Info className="text-primary h-4 w-4" />;
    }
  };

  return (
    <div className="animate-entrance -mx-6 -mt-6 flex min-h-full flex-col">
      <PageHeader
        category="System"
        title="Notifications"
        action={
          unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-text-muted hover:text-text-primary h-8 gap-1.5 font-mono text-[10px] tracking-widest uppercase transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )
        }
      />

      {/* Tabs & Pagination Controls */}
      <div className="border-border-default flex items-center justify-between border-b px-6 py-2.5">
        <div className="flex items-center gap-1">
          {STATUS_TABS.map((t) => (
            <Button
              key={t.value}
              variant={tab === t.value ? 'default' : 'secondary'}
              size="sm"
              onClick={() => {
                setTab(t.value);
                setPage(1);
              }}
              className={cn(
                'h-7 px-2.5 font-mono text-xs tracking-wider uppercase transition-all',
                tab !== t.value && 'bg-secondary/50 text-text-secondary hover:text-text-primary'
              )}
            >
              {t.label}
              {t.value === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
            </Button>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-text-secondary font-mono text-xs uppercase">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-6 w-6 transition-all disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-6 w-6 transition-all disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeProjectId === null ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <DaemonMascot size={48} expression="idle" />
            <p className="text-text-secondary font-mono text-sm">
              Select a project to view notifications.
            </p>
          </div>
        ) : isLoading && !data ? (
          <div className="text-text-secondary py-16 text-center font-mono text-xs">Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <Bell className="text-text-muted/20 h-12 w-12" />
            <p className="text-text-secondary font-mono text-sm">
              No {tab === 'unread' ? 'unread ' : ''}notifications.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'border-border-default/50 flex cursor-pointer items-center gap-4 border-b py-3 pr-6 transition-colors',
                  !n.readAt
                    ? 'border-l-accent-violet bg-accent-violet/5 border-l-2 pl-[22px]'
                    : 'hover:bg-bg-elevated/50 border-l-2 border-l-transparent pl-[22px]'
                )}
                onClick={() => !n.readAt && handleMarkRead(n.id)}
              >
                <div className="shrink-0">{getTypeIcon(n.type)}</div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm leading-snug',
                      !n.readAt ? 'text-text-primary font-medium' : 'text-text-secondary'
                    )}
                  >
                    {n.title}
                  </p>
                  <p className="text-text-secondary mt-0.5 line-clamp-1 text-xs">{n.message}</p>
                  <p className="text-text-muted mt-0.5 font-mono text-xs uppercase">
                    {formatRelativeTime(n.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
