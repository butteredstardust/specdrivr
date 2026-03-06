'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Logo } from './logo';
import { DatabaseStatus } from './database-status';
import { UserMenu } from './user-menu';
import { ProjectSidebarWrapper } from './project-sidebar-wrapper';
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

  const NavLink = ({ href, children, exact = false }: { href: string; children: ReactNode; exact?: boolean }) => {
    const isActive = exact ? pathname === href : pathname?.startsWith(href);
    return (
      <Link
        href={href}
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
          padding: '0 12px',
          height: '56px',
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none',
          borderBottom: isActive ? '2px solid #A78BFA' : '2px solid transparent',
          transition: 'color 120ms ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; }}
        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)'; }}
      >
        {children}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-page)] font-sans">
      {/* Top Nav - 56px fixed */}
      <header className="fixed top-0 left-0 right-0 w-full h-[56px] z-[100] px-[var(--sp-4)] flex items-center" style={{ background: '#1E1B4B' }}>
        <Link href="/" className="flex items-center">
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '20px',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #A78BFA 0%, #60A5FA 100%)',
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

        <nav className="flex items-center" style={{ marginLeft: '24px' }}>
          <NavLink href="/" exact>Dashboard</NavLink>
          <NavLink href="/settings">Settings</NavLink>
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

    </div>
  );
}
