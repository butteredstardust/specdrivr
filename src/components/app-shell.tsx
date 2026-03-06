'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Logo } from './logo';
import { DatabaseStatus } from './database-status';
import { UserMenu } from './user-menu';
import { ProjectSidebarWrapper } from './project-sidebar-wrapper';
import { BottomTabs } from './bottom-tabs';
import Link from 'next/link';

export interface AppShellProps {
  children: ReactNode;
  showSidebar?: boolean;
  sidebarProjects?: any[];
  currentProjectId?: number;
}

export function AppShell({
  children,
  showSidebar = true,
  sidebarProjects = [],
  currentProjectId,
}: AppShellProps) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-page)] font-sans">
      {/* Top Nav - 56px fixed */}
      <header className="fixed top-0 left-0 right-0 h-[56px] bg-[var(--color-brand-bold)] z-[100] px-[var(--sp-4)] flex items-center gap-[var(--sp-2)]">
        <Link href="/" className="flex items-center gap-[var(--sp-2)]">
          <div className="text-[14px] font-bold text-white uppercase tracking-tight">Spec-Drivr</div>
        </Link>

        <nav className="flex items-center gap-[var(--sp-2)]">
          <Link href="/" className="text-[12px] font-medium text-white/85 px-[var(--sp-2)] py-[var(--sp-1)] rounded-[var(--radius-md)] hover:bg-white/12 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/settings" className="text-[12px] font-medium text-white/85 px-[var(--sp-2)] py-[var(--sp-1)] rounded-[var(--radius-md)] hover:bg-white/12 hover:text-white transition-colors">
            Settings
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-[var(--sp-2)]">
          <DatabaseStatus />
          <UserMenu />
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex pt-[56px]">
        {/* Sidebar - 240px fixed */}
        {showSidebar && (
          <aside className="fixed top-[56px] left-0 bottom-0 w-[240px] bg-[var(--color-bg-surface)] border-r border-[var(--color-border-default)] overflow-y-auto p-[var(--sp-3)] p-[var(--sp-2)]">
            <ProjectSidebarWrapper
              projects={sidebarProjects}
              currentProjectId={currentProjectId}
            />
          </aside>
        )}

        {/* Content Area */}
        <main className={`flex-1 min-h-[calc(100vh-56px)] bg-[var(--color-bg-page)] ${showSidebar ? 'ml-[240px]' : ''}`}>
          {isOffline && (
            <div className="bg-[var(--status-paused-bg)] border-b border-[var(--color-border-default)] py-[var(--sp-2)] px-[var(--sp-4)] text-center text-[var(--status-paused-text)] text-[13px] font-medium">
              You&apos;re offline — changes won&apos;t save until connection is restored
            </div>
          )}
          <div className="p-[var(--sp-6)]">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tabs */}
      <BottomTabs />
    </div>
  );
}
