'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ReactNode } from 'react';

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
    <div className={`border-b border-ios-border ${className}`}>
      <nav className="flex space-x-0 ios-scrollbar overflow-x-auto">
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
    <Link href={tab.href}>
      <div
        className={`
          relative flex items-center gap-2 px-4 py-3 ios-body font-medium transition-colors whitespace-nowrap
          ${isActive
            ? 'text-ios-blue ios-tab-active'
            : 'text-ios-text-secondary ios-tab-inactive'
          }
        `}
      >
        {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
        <span>{tab.label}</span>
        {tab.badge && (
          <span
            className={`
              ios-badge px-2 py-0.5 rounded-full text-[11px]
              ${isActive
                ? 'bg-ios-blue text-white'
                : 'bg-ios-gray-5 text-ios-text-secondary'
              }
            `}
          >
            {typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge}
          </span>
        )}
      </div>
    </Link>
  );
}

function getCurrentTabFromPath(pathname: string, tabs: TabData[]): string {
  // Find the tab whose href matches or is a prefix of the current path
  const exactMatch = tabs.find(tab => tab.href === pathname);
  if (exactMatch) return exactMatch.id;

  // Check for prefix match (deepest match wins)
  const prefixMatch = tabs
    .filter(tab => pathname.startsWith(tab.href) && tab.href !== '/')
    .sort((a, b) => b.href.length - a.href.length)[0];

  return prefixMatch?.id || tabs[0]?.id || '';
}
