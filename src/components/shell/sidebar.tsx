'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PxlKitIcon } from '@pxlkit/core';
import { Home, List, History, Settings } from '@pxlkit/ui';
import { PixelBadge, PixelPulse, PixelButton } from '@pxlkit/ui-kit';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { ProjectSwitcher } from '@/components/shell/project-switcher';
import { useShell } from '@/components/providers/shell-provider';
import { twMerge } from 'tailwind-merge';

const navItems = [
  { label: 'Mission Control', href: '/', icon: Home },
  { label: 'Specifications', href: '/specs', icon: List },
  { label: 'Sessions', href: '/sessions', icon: History },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { devMode } = useShell();

  // Polling states for DAEMON footer would go here.
  // Stubbing according to TASK-018
  const blockedCount = 0;
  const sessionRunning = false;
  const sessionPaused = false;
  let daemonStatusNode = null;
  let daemonExpression: 'idle' | 'working' | 'error' | 'success' = 'idle';

  if (blockedCount > 0) {
    daemonStatusNode = (
      <PixelButton
        variant="ghost"
        onClick={() => router.push('/')}
        className="h-auto p-0 transition-opacity hover:opacity-80"
      >
        <PixelBadge tone="gold">⚠ {blockedCount} BLOCKED</PixelBadge>
      </PixelButton>
    );
    daemonExpression = 'error';
  } else if (sessionRunning) {
    daemonStatusNode = (
      <PixelPulse>
        <PixelBadge tone="purple">● RUNNING</PixelBadge>
      </PixelPulse>
    );
    daemonExpression = 'working';
  } else if (sessionPaused) {
    daemonStatusNode = <PixelBadge tone="gold">⏸ PAUSED</PixelBadge>;
    daemonExpression = 'idle';
  } else {
    daemonStatusNode = <span className="font-mono text-xs text-[--text-muted]">SYSTEM READY</span>;
    daemonExpression = 'idle';
  }

  return (
    <aside className="flex h-full w-[240px] flex-shrink-0 flex-col border-r border-[--border-default] bg-[--bg-surface]">
      {/* Logo Area */}
      <div className="flex h-14 items-center gap-3 border-b border-[--border-default] px-4">
        <DaemonMascot size="sm" state="idle" />
        <span className="font-mono text-xs tracking-widest text-[--text-primary] uppercase">
          SPECDRIVR
        </span>
      </div>

      {/* Project Switcher */}
      <div className="border-b border-[--border-default] p-4">
        <ProjectSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto py-4">
        {navItems.map((item) => {
          // Exact match for root, prefix match for others
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          return (
            <PixelButton
              key={item.href}
              variant="ghost"
              onClick={() => router.push(item.href)}
              className={twMerge(
                'flex w-full items-center justify-start gap-3 rounded-none px-4 py-2 text-left text-sm font-medium transition-colors',
                isActive
                  ? 'border-l-2 border-[--accent-violet] bg-[--accent-violet]/5 text-[--accent-violet]'
                  : 'border-l-2 border-transparent text-[--text-secondary] hover:bg-[--bg-elevated] hover:text-[--text-primary]'
              )}
            >
              <PxlKitIcon icon={item.icon} size={16} color="currentColor" />
              {item.label}
            </PixelButton>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="relative mt-auto flex flex-col gap-2 border-t border-[--border-default] p-4">
        <div className="flex h-6 items-center gap-2">
          <DaemonMascot size="sm" state={daemonExpression} className="h-4 w-4" />
          {daemonStatusNode}
        </div>

        <div className="flex items-center justify-between text-[--text-muted]">
          <span className="font-mono text-[10px]">v0.1.0</span>
          {devMode && <PixelBadge tone="gold">[DEV]</PixelBadge>}
        </div>
      </div>
    </aside>
  );
}
