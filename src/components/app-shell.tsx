'use client';

import { ReactNode, useState } from 'react';
import { Logo, LogoProps } from './logo';
import { DatabaseStatus } from './database-status';
import { UserMenu } from './user-menu';
import { ProjectSidebarWrapper } from './project-sidebar-wrapper';
import { BottomTabs } from './bottom-tabs';

export interface AppShellProps {
  children: ReactNode;
  showSidebar?: boolean;
  logoProps?: Omit<LogoProps, 'size'>;
  showDatabaseStatus?: boolean;
  showUserMenu?: boolean;
  sidebarProjects?: any[];
  currentProjectId?: number;
}

export function AppShell({
  children,
  showSidebar = true,
  logoProps,
  showDatabaseStatus = true,
  showUserMenu = true,
  sidebarProjects = [],
  currentProjectId,
}: AppShellProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissedOffline, setDismissedOffline] = useState(false);

  // Online/offline detection
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => setIsOffline(false));
    window.addEventListener('offline', () => setIsOffline(true));
    setIsOffline(!navigator.onLine);
  }

  return (
    <div className="min-h-screen bg-ios-bg-primary ios-font-text">
      {/* Offline Banner */}
      {isOffline && !dismissedOffline && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-amber-100 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-700 py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-700 dark:text-amber-300">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
            <p className="ios-callout text-amber-900 dark:text-amber-100">
              You&apos;re offline — changes won&apos;t save until connection is restored
            </p>
            <button
              onClick={() => setDismissedOffline(true)}
              className="ml-auto p-1 hover:bg-amber-200 dark:hover:bg-amber-800 rounded transition-colors"
              aria-label="Dismiss"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-700 dark:text-amber-300">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`sticky z-50 ios-header border-b border-ios-border ${isOffline && !dismissedOffline ? 'top-10' : 'top-0'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left side - Logo */}
            <div className="flex-1">
              <Logo size="large" className="min-w-40" {...logoProps} />
            </div>

            {/* Right side - Header actions */}
            <div className="flex items-center gap-3">
              {showDatabaseStatus && <DatabaseStatus />}
              {showUserMenu && <UserMenu />}
            </div>
          </div>
        </div>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex h-[calc(100vh-57px)] pt-0 md:pb-0 pb-20">
        {/* Sidebar (hidden on mobile) */}
        {showSidebar && (
          <aside className="hidden md:flex w-60 flex-shrink-0 border-r border-ios-border bg-ios-bg-card ios-scrollbar overflow-y-auto">
            <ProjectSidebarWrapper
              projects={sidebarProjects}
              currentProjectId={currentProjectId}
            />
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto ios-scrollbar bg-ios-bg-primary">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
            {children}
          </div>
        </main>

        {/* Bottom Tabs (visible on mobile only) */}
        <BottomTabs />
      </div>
    </div>
  );
}
