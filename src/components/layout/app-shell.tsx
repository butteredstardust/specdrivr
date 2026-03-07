'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Logo } from './logo';
import { DatabaseStatus } from './database-status';
import { UserMenu } from './user-menu';
import { ProjectSidebarWrapper } from './project-sidebar-wrapper';
import { CreateProjectDialog } from '@/components/features/projects/create-project-dialog';
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

  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-page)]">
      {/* Top Nav - 56px fixed */}
      <header className="fixed top-0 left-0 right-0 w-full h-[56px] z-[100] px-[var(--sp-4)] flex items-center" style={{ background: 'var(--nav-bg)' }}>
        <Link href="/" className="flex items-center">
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '30px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, var(--brand-accent) 0%, var(--brand-accent-end) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
            userSelect: 'none',
            textTransform: 'lowercase'
          }}>
            specdrivr
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-[var(--sp-2)]">
          <DatabaseStatus />
          <UserMenu />
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex mt-[56px] items-stretch min-h-[calc(100vh-56px)]">
        {/* Sidebar */}
        {showSidebar && (
          <ProjectSidebarWrapper
            projects={sidebarProjects}
            currentProjectId={currentProjectId}
          />
        )}

        {/* Content Area */}
        <main className="flex-1 min-w-0 flex flex-col bg-[var(--bg-page)]">
          {isOffline && (
            <div className="bg-[var(--status-paused-bg)] border-b border-[var(--border-default)] py-[var(--sp-2)] px-[var(--sp-4)] text-center text-[var(--status-paused-text)] text-[13px] font-medium">
              You&apos;re offline — changes won&apos;t save until connection is restored
            </div>
          )}
          <div className="p-[var(--sp-6)] flex-1">
            {children}
          </div>
        </main>
      </div>

      <CreateProjectDialog />
    </div>
  );
}
