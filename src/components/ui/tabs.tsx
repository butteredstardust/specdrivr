'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ReactNode } from 'react';
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

export function Tabs({ tabs, activeTab, className = '' }: TabsProps) {
  const pathname = usePathname();
  const currentTab = activeTab || getCurrentTabFromPath(pathname, tabs);

  return (
    <div className={cn("border-b border-[var(--color-border-default)]", className)}>
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

function TabItem({ tab, isActive }: { tab: TabData; isActive: boolean }) {
  return (
    <Link href={tab.href} className="group outline-none">
      <div
        className={cn(
          "relative flex items-center gap-[var(--sp-2)] h-[40px] px-[var(--sp-1)] text-[12px] font-medium transition-colors whitespace-nowrap outline-none",
          isActive
            ? "text-[var(--color-brand-bold)]"
            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        )}
      >
        {tab.icon && <span className="flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">{tab.icon}</span>}
        <span>{tab.label}</span>
        {tab.badge !== undefined && (
          <span
            className={cn(
              "min-w-[16px] h-[16px] px-1 rounded-full text-[10px] flex items-center justify-center font-bold",
              isActive
                ? "bg-[var(--color-brand-bold)] text-white"
                : "bg-[var(--color-bg-sunken)] text-[var(--color-text-secondary)]"
            )}
          >
            {typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge}
          </span>
        )}

        {/* Underline Indicator */}
        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-brand-bold)] rounded-t-sm" />
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
