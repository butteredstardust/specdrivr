'use client';

import { ProjectSelect } from '@/db/schema';
import { CreateProjectDialog } from './create-project-dialog';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Logo } from './logo';
import { DatabaseStatus } from './database-status';
import { UserMenu } from './user-menu';

interface ProjectSidebarProps {
  projects: ProjectSelect[];
  activeProjectId?: number;
  currentProjectId?: number;
  onProjectSelect?: (project: ProjectSelect) => void;
  onProjectCreated?: (project: ProjectSelect) => void;
}

export function ProjectSidebar({ projects, activeProjectId, currentProjectId, onProjectSelect, onProjectCreated }: ProjectSidebarProps) {
  const pathname = usePathname();
  const isHomeActive = pathname === '/';
  const activeId = currentProjectId || activeProjectId;

  return (
    <div className="w-[220px] h-full flex flex-col bg-bg-secondary border-r border-border-subtle" style={{ padding: '12px 8px' }}>
      {/* Logo Area */}
      <div className="h-[48px] px-2 flex items-center shrink-0">
        <Link href="/" className="text-[14px] font-semibold text-text-primary hover:opacity-80 transition-opacity flex flex-col">
          specdrivr
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto mt-2">
        <nav className="space-y-[2px]">
          {/* Home Link */}
          <Link
            href="/"
            className={`flex items-center h-[30px] px-2 rounded-md text-[12px] font-medium transition-colors ${isHomeActive
                ? 'bg-accent-subtle text-accent'
                : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`}
          >
            <svg className="w-[14px] h-[14px] mr-2 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Home
          </Link>

          {/* Settings Link */}
          <Link
            href="/settings"
            className={`flex items-center h-[30px] px-2 rounded-md text-[12px] font-medium transition-colors ${pathname === '/settings'
                ? 'bg-accent-subtle text-accent'
                : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`}
          >
            <svg className="w-[14px] h-[14px] mr-2 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </Link>

          <div className="pt-4 pb-1 px-2">
            <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.04em]">Projects</span>
          </div>

          {/* Projects List */}
          {projects.map((project) => {
            const isProjectActive = pathname === `/projects/${project.id}` || activeId === project.id;
            const agentStatus = (project as any).agentStatus || 'idle';
            const dotColor: Record<string, string> = {
              running: 'var(--color-status-running)',
              paused: 'var(--color-warning)',
              error: 'var(--color-status-error)',
              idle: 'var(--color-status-idle)',
              stopped: 'var(--color-status-idle)',
              stale: 'var(--color-warning)',
            };

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                onClick={(e) => {
                  if (onProjectSelect) {
                    // We don't preventDefault if it's meant to navigate, but keeping original logic
                    // Actually, if we're on mobile we might want to do something, but sidebar is fixed 220px now.
                    onProjectSelect(project);
                  }
                }}
                className={`flex items-center h-[30px] px-2 rounded-md text-[12px] font-medium transition-colors ${isProjectActive
                    ? 'bg-accent-subtle text-accent'
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                  }`}
              >
                <span
                  className="w-[6px] h-[6px] rounded-full shrink-0 mr-2"
                  style={{ backgroundColor: dotColor[agentStatus] || 'var(--color-status-idle)' }}
                />
                <span className="truncate">{project.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto pt-2 shrink-0 flex flex-col gap-2">
        <div className="px-2">
          <CreateProjectDialog onProjectCreated={onProjectCreated} />
        </div>
        <div className="h-px bg-border-border-subtle my-2 mx-2" />
        <div className="flex items-center px-2 pb-2 gap-2">
          <UserMenu />
          <DatabaseStatus />
        </div>
      </div>
    </div>
  );
}
