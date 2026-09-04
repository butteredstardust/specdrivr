'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePolling } from '@/hooks/use-polling';
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
  /**
   * The domain event that produced the notification. This used to be typed as
   * `'info' | 'success' | 'warning' | 'error' | 'mention'`, none of which any
   * writer ever emits, so every row fell through to the generic info icon.
   */
  type: string;
  title: string;
  body: string;
  linkUrl: string;
  createdAt: string;
  readAt: string | null;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  pages: number;
}

// No "Mentions" tab: it filtered on `type=mention`, which nothing in the
// application ever writes, so it was a permanently empty view.
const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
] as const;

type TabValue = (typeof STATUS_TABS)[number]['value'];

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<TabValue>('all');

  // Deliberately not scoped to the active project. Notifications are addressed
  // to a user, the bell badge counts every unread one they have, and "mark all
  // read" clears them all — scoping only this list to `activeProjectId` was why
  // a badge reading 5 opened a page showing 2.
  const buildFetchUrl = () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '50');
    if (tab === 'unread') params.set('unreadOnly', 'true');
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
    try {
      // No projectId: the endpoint marks every notification for the user and
      // has never read that parameter, so passing it only implied a narrower
      // effect than the button actually has.
      const res = await fetch('/api/v1/notifications/read-all', {
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
      case 'session_complete':
      case 'plan_approved':
        return <CheckCircle2 className="text-success h-4 w-4" />;
      case 'session_failed':
      case 'plan_rejected':
        return <AlertCircle className="text-danger h-4 w-4" />;
      case 'task_blocked':
      case 'changes_requested':
        return <AlertCircle className="text-warning h-4 w-4" />;
      case 'member_invited':
      case 'role_changed':
        return <Bell className="text-accent h-4 w-4" />;
      default:
        return <Info className="text-accent h-4 w-4" />;
    }
  };

  return (
    <div className="animate-fade-in-up full-bleed flex min-h-full flex-col">
      <PageHeader
        category="System"
        title="Notifications"
        action={
          unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-fg-muted hover:text-fg text-2xs h-8 gap-1.5 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )
        }
      />

      {/* Tabs & Pagination Controls */}
      <div className="border-line flex items-center justify-between border-b px-6 py-2.5">
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
                'h-7 px-2.5 text-xs transition-all',
                tab !== t.value && 'bg-surface-inset text-fg-secondary hover:text-fg'
              )}
            >
              {t.label}
              {t.value === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
            </Button>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-fg-secondary text-xs">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
                className="h-6 w-6 transition-all disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
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
        {isLoading && !data ? (
          <div className="text-fg-secondary py-16 text-center font-mono text-xs">Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <Bell className="text-fg-muted/20 h-12 w-12" />
            <p className="text-fg-secondary text-sm">
              No {tab === 'unread' ? 'unread ' : ''}notifications.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((n) => {
              const unread = !n.readAt;
              // Every notification carries a `linkUrl` to the thing it is about,
              // so the whole row is a link. It previously navigated nowhere: an
              // unread row only marked itself read and a read one was inert.
              return (
                <Link
                  key={n.id}
                  href={n.linkUrl}
                  onClick={() => {
                    if (unread) handleMarkRead(n.id);
                  }}
                  className={cn(
                    'border-line-subtle flex w-full items-center gap-4 border-b py-3 pr-6 pl-[22px] text-left transition-colors',
                    unread
                      ? 'border-l-accent bg-accent-subtle hover:bg-accent-subtle/70 border-l-2'
                      : 'hover:bg-surface-inset border-l-2 border-l-transparent'
                  )}
                >
                  <div className="shrink-0">{getTypeIcon(n.type)}</div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-sm leading-snug',
                        unread ? 'text-fg font-medium' : 'text-fg-secondary'
                      )}
                    >
                      {n.title}
                    </p>
                    {/* `body`, not `message` — the API has never returned a
                        `message` field, so this line was always blank. */}
                    <p className="text-fg-secondary mt-0.5 line-clamp-1 text-xs">{n.body}</p>
                    <p className="text-fg-muted mt-0.5 text-xs">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
