'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ReactNode, Suspense } from 'react';
import { cn } from '@/lib/utils';

export interface TabData {
  id: string;
  label: string;
  href: string;
  badge?: number | string;
  icon?: ReactNode;
}

export interface TabsProps {
  tabs: TabData[];
  activeTab?: string;
  className?: string;
}

function TabsContent({ tabs, activeTab, className }: TabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  // If activeTab is explicitly provided, use it.
  // Otherwise, if tab param exists, look for a tab whose href includes `?tab=${tabParam}`
  // Otherwise fallback to path matching
  let currentTab = activeTab;
  if (!currentTab) {
    if (tabParam) {
      const match = tabs.find(t => t.href.includes(`tab=${tabParam}`));
      if (match) currentTab = match.id;
    }
    if (!currentTab) {
      currentTab = getCurrentTabFromPath(pathname, tabs);
    }
  }

  return (
    <div className={cn("border-b border-[var(--border-default)]", className)}>
      <nav className="flex items-center gap-[var(--sp-4)] overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={isActive}
            />
          );
        })}
      </nav>
    </div>
  );
}

export function Tabs(props: TabsProps) {
  return (
    <Suspense fallback={<div className={cn("border-b border-[var(--border-default)] h-[41px]", props.className)} />}>
      <TabsContent {...props} />
    </Suspense>
  );
}

function TabItem({ tab, isActive }: { tab: TabData; isActive: boolean }) {
  return (
    <Link href={tab.href} className="group outline-none">
      <div
        className={cn(
          "relative flex items-center gap-[6px] h-[36px] px-[12px] text-[13px] font-medium transition-colors whitespace-nowrap mb-[-1px] outline-none border-b-2",
          isActive
            ? "text-[var(--brand-primary)] border-[var(--brand-primary)]"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent"
        )}
      >
        {tab.icon && <span className="flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">{tab.icon}</span>}
        <span>{tab.label}</span>
        {tab.badge !== undefined && (
          <span
            className={cn(
              "min-w-[16px] h-[16px] px-1 rounded-full text-[10px] flex items-center justify-center font-bold",
              isActive
                ? "bg-[var(--brand-primary)] text-white"
                : "bg-[var(--bg-sunken)] text-[var(--text-secondary)]"
            )}
          >
            {typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge}
          </span>
        )}
      </div>
    </Link>
  );
}

function getCurrentTabFromPath(pathname: string, tabs: TabData[]): string {
  const exactMatch = tabs.find(tab => tab.href === pathname);
  if (exactMatch) return exactMatch.id;
  const prefixMatch = tabs
    .filter(tab => pathname.startsWith(tab.href) && tab.href !== '/')
    .sort((a, b) => b.href.length - a.href.length)[0];
  return prefixMatch?.id || tabs[0]?.id || '';
}
