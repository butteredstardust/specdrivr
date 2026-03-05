'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, PlusSquare, Layout, Cog } from 'lucide-react';

interface BottomTab {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const tabs: BottomTab[] = [
  { href: '/', label: 'Dashboard', icon: <Layout className="w-6 h-6" /> },
  { href: '/projects/new', label: 'New Project', icon: <PlusSquare className="w-6 h-6" /> },
  { href: '/settings', label: 'Settings', icon: <Cog className="w-6 h-6" /> },
];

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-ios-bg-card/95 backdrop-blur-ios border-t border-ios-border md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-20">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-16 h-16 min-w-[44px] min-h-[44px] mx-1 rounded-ios-md transition-all ${
                isActive
                  ? 'text-ios-blue'
                  : 'text-ios-text-secondary hover:text-ios-text-primary'
              }`}
            >
              <div className="mb-1">{tab.icon}</div>
              <span className="ios-caption-1 font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}