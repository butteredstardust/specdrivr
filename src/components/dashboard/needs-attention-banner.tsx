'use client';

import React, { useState, useEffect } from 'react';
import { PixelBadge, PixelButton } from '@pxlkit/ui-kit';
import { DaemonMascot } from '@/components/ui/daemon-mascot';

interface NeedsAttentionBannerProps {
  blockedTasks: { id: string; externalId: string }[];
}

export function NeedsAttentionBanner({ blockedTasks }: NeedsAttentionBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Re-show banner if blocked tasks change (i.e. new tasks become blocked)
  useEffect(() => {
    setIsDismissed(false);
  }, [blockedTasks.length]);

  if (isDismissed || blockedTasks.length === 0) return null;

  return (
    <div className="flex w-full items-center justify-between border-b border-[--phosphor-amber]/30 bg-[--phosphor-amber]/10 px-4 py-2">
      <div className="flex items-center gap-3">
        <DaemonMascot size="sm" state="blocked" />
        <span className="text-sm font-medium text-[--phosphor-amber]">
          I need your help with {blockedTasks.length} task{blockedTasks.length !== 1 ? 's' : ''}
        </span>
        <div className="ml-2 flex flex-wrap gap-2">
          {blockedTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => {
                // TODO: Wire up when Task Drawer is built
                // onOpenDrawer(task.id);
              }}
              className="hover:opacity-80 focus:ring-1 focus:ring-[--phosphor-amber] focus:outline-none"
            >
              <PixelBadge tone="gold">{task.externalId}</PixelBadge>
            </button>
          ))}
        </div>
      </div>
      <PixelButton tone="neutral" size="sm" onClick={() => setIsDismissed(true)}>
        Dismiss
      </PixelButton>
    </div>
  );
}
