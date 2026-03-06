'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layout, Settings } from 'lucide-react';

interface BottomTab {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: BottomTab[] = [
  { href: '/', label: 'Dashboard', icon: <Layout size={20} /> },
  { href: '/settings', label: 'Settings', icon: <Settings size={20} /> },
];

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-[var(--color-bg-surface)] border-t border-[var(--color-border-default)] lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-[56px]">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-[56px] h-[44px] rounded-[var(--radius-md)] transition-colors ${isActive
                ? 'text-[var(--color-brand-bold)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
            >
              <div className="mb-[var(--sp-1)]">{tab.icon}</div>
              <span className="text-[var(--font-size-xs)] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}