"use client";

import { ProjectSelect } from '@/db/schema';
import { CreateProjectDialog } from './create-project-dialog';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSidebar } from './project-sidebar-wrapper';
import { agentStatusColors, type AgentStatus } from '@/lib/ios-styles';

interface ProjectSidebarProps {
  projects: ProjectSelect[];
  activeProjectId?: number;
  currentProjectId?: number;
  onProjectSelect?: (project: ProjectSelect) => void;
  onProjectCreated?: (project: ProjectSelect) => void;
}

function getAgentStatusClass(status: string): string {
  const statusMap: Record<string, string> = {
    idle: 'ios-status-dot-idle',
    running: 'ios-status-dot-running',
    paused: 'ios-status-dot-paused',
    stopped: 'ios-status-dot-idle',
    error: 'ios-status-dot-error',
  };
  return statusMap[status] || 'ios-status-dot-idle';
}

export function ProjectSidebar({ projects, activeProjectId, currentProjectId, onProjectSelect, onProjectCreated }: ProjectSidebarProps) {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const isHomeActive = pathname === '/';

  // Normalize current project ID for comparison
  const activeId = currentProjectId || activeProjectId;

  return (
    <div className="h-full flex flex-col">
      {/* Sidebar header */}
      <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigation</span>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          aria-label="Hide sidebar"
          title="Hide sidebar"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="px-2 space-y-0.5">
          {/* Home Link */}
          <Link
            href="/"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${isHomeActive
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Home
          </Link>

          {/* Divider */}
          <div className="h-px bg-gray-100 my-2" />

          {/* Projects Header */}
          <div className="px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Projects</span>
          </div>

          {/* Projects List */}
          {projects.map((project) => {
            const isProjectActive = pathname === `/projects/${project.id}` || activeId === project.id;
            const agentStatus = (project as any).agentStatus || 'idle';
            const dotColor: Record<string, string> = {
              running: 'bg-emerald-500',
              paused: 'bg-amber-400',
              error: 'bg-red-500',
              idle: 'bg-gray-300',
              stopped: 'bg-gray-300',
              stale: 'bg-orange-400',
            };

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                onClick={(e) => {
                  if (onProjectSelect) {
                    e.preventDefault();
                    onProjectSelect(project);
                  }
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${isProjectActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor[agentStatus] || 'bg-gray-300'}`} />
                <span className="truncate" title={project.name}>{project.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex gap-2">
          <Link
            href="/settings"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </Link>
          <div className="flex-1 min-w-0">
            <CreateProjectDialog onProjectCreated={onProjectCreated} />
          </div>
        </div>
      </div>
    </div>
  );
}
