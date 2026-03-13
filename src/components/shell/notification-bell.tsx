'use client';

import React, { useEffect, useState } from 'react';
import { AnimatedPxlKitIcon, PxlKitIcon } from '@pxlkit/core';
import { ShakingBell } from '@pxlkit/ui';
import { Bell } from '@pxlkit/feedback';
import { PixelBadge, PixelModal, PixelEmptyState, PixelButton } from '@pxlkit/ui-kit';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function checkNotifications() {
      try {
        const res = await fetch('/api/v1/notifications?unreadOnly=true&limit=1', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          const notifications: Array<{ read: boolean }> = data.data ?? [];
          const currentUnreadCount = notifications.filter((n) => !n.read).length;
          setUnreadCount(currentUnreadCount);
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
      <PixelButton
        variant="ghost"
        onClick={() => setOpen(true)}
        className="relative h-10 w-10 p-2 text-[--text-secondary] transition-colors hover:bg-[--bg-elevated]"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <AnimatedPxlKitIcon icon={ShakingBell} size={16} colorful trigger="loop" />
        ) : (
          <PxlKitIcon icon={Bell} size={16} color="currentColor" />
        )}

        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 transform">
            <PixelBadge tone="gold">{unreadCount > 9 ? '9+' : unreadCount}</PixelBadge>
          </span>
        )}
      </PixelButton>

      <PixelModal open={open} title="NOTIFICATIONS" onClose={() => setOpen(false)}>
        <PixelEmptyState
          title="Nothing to report."
          description="You're all caught up."
          icon={<PxlKitIcon icon={Bell} size={20} />}
        />
      </PixelModal>
    </>
  );
}
