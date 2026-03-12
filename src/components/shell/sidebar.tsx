'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PxlKitIcon } from '@pxlkit/core';
import { Home, List, History, Settings } from '@pxlkit/ui';
import { PixelBadge, PixelPulse } from '@pxlkit/ui-kit';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { ProjectSwitcher } from '@/components/shell/project-switcher';
import { useShell } from '@/components/providers/shell-provider';
import { twMerge } from 'tailwind-merge';

const navItems = [
  { label: 'Mission Control', href: '/',         icon: Home    },
  { label: 'Specifications',  href: '/specs',    icon: List    },
  { label: 'Sessions',        href: '/sessions', icon: History },
  { label: 'Settings',        href: '/settings', icon: Settings},
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
      <button onClick={() => router.push('/')} className="hover:opacity-80 transition-opacity">
        <PixelBadge tone="gold">⚠ {blockedCount} BLOCKED</PixelBadge>
      </button>
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
    daemonStatusNode = (
      <span className="text-xs font-mono text-[--text-muted]">SYSTEM READY</span>
    );
    daemonExpression = 'idle';
  }

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col h-full bg-[--bg-surface] border-r border-[--border-default]">
      {/* Logo Area */}
      <div className="h-14 flex items-center px-4 gap-3 border-b border-[--border-default]">
        <DaemonMascot size="sm" state="idle" />
        <span className="font-mono text-xs uppercase tracking-widest text-[--text-primary]">
          SPECDRIVR
        </span>
      </div>

      {/* Project Switcher */}
      <div className="p-4 border-b border-[--border-default]">
        <ProjectSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          // Exact match for root, prefix match for others
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={twMerge(
                "flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors w-full text-left",
                isActive
                  ? "border-l-2 border-[--accent-violet] text-[--accent-violet] bg-[--accent-violet]/5"
                  : "border-l-2 border-transparent text-[--text-secondary] hover:text-[--text-primary] hover:bg-[--bg-elevated]"
              )}
            >
              <PxlKitIcon icon={item.icon} size={16} color="currentColor" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-[--border-default] flex flex-col gap-2 relative mt-auto">
        <div className="flex items-center gap-2 h-6">
          <DaemonMascot size="sm" state={daemonExpression} className="w-4 h-4" />
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
