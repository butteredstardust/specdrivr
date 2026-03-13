'use client';

import React, { useEffect, useState } from 'react';
import { AnimatedPxlKitIcon, PxlKitIcon } from '@pxlkit/core';
import { ShakingBell } from '@pxlkit/ui';
import { Bell } from '@pxlkit/feedback';
import { PixelBadge, PixelModal, PixelEmptyState } from '@pxlkit/ui-kit';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function checkNotifications() {
      try {
        const res = await fetch('/api/v1/notifications?unreadOnly=true&limit=1', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          // Assuming { meta: { unreadCount: N } } or { count: N }
          setUnreadCount(data?.meta?.unreadCount ?? data?.count ?? 0);
        }
      } catch {
        // fail silently for polling
      }
    }

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 rounded-md hover:bg-[--bg-elevated] text-[--text-secondary] transition-colors"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <AnimatedPxlKitIcon icon={ShakingBell} size={16} colorful trigger="loop" />
        ) : (
          <PxlKitIcon icon={Bell} size={16} color="currentColor" />
        )}

        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
            <PixelBadge tone="gold">{unreadCount > 9 ? '9+' : unreadCount}</PixelBadge>
          </span>
        )}
      </button>

      <PixelModal open={open} title="NOTIFICATIONS" onClose={() => setOpen(false)}>
        <PixelEmptyState
          title="Nothing to report." description="You're all caught up."
          icon={<PxlKitIcon icon={Bell} size={20} />}
        />
      </PixelModal>
    </>
  );
}
