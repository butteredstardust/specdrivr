"use client";

import { ProjectSelect } from '@/db/schema';
import { CreateProjectDialog } from './create-project-dialog';
import { usePathname } from 'next/navigation';
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
    <div className="w-64 h-screen flex flex-col ios-font p-3">
      {/* Floating Sidebar Container */}
      <div className="flex-1 flex flex-col ios-card shadow-lg overflow-hidden">
        {/* Header with Hide Button */}
        <div className="p-[13px] border-b border-opacity-12 flex items-center justify-between" style={{ borderColor: 'var(--ios-separator)' }}>
          <div>
            <h2 className="text-[17px] font-semibold text-ios-primary mb-1 ios-font-display">
              Menu
            </h2>
            <p className="text-[13px] text-ios-placeholder ios-font-text">
              Navigate your workspace
            </p>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-opacity-80 hover:bg-ios-secondary transition-colors"
            aria-label="Hide sidebar"
            title="Hide sidebar"
          >
            <svg
              className="w-5 h-5 text-ios-placeholder"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-3 space-y-2">
            {/* Home Link */}
            <a
              href="/"
              className={`
                block cursor-pointer ios-radius p-[13px] transition-colors ios-font-text
                ${isHomeActive
                  ? 'bg-ios-blue text-white'
                  : 'bg-ios-secondary hover:bg-opacity-80'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🏠</span>
                <span className="text-[17px] font-medium">Home</span>
              </div>
            </a>

            {/* Divider */}
            <div className="h-[1px] bg-opacity-12 my-2" style={{ backgroundColor: 'var(--ios-separator)' }} />

            {/* Projects Header */}
            <div className="px-2 py-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ios-placeholder">
                Projects
              </h3>
            </div>

            {/* Projects List */}
            {projects.map((project) => {
              const isProjectActive = pathname === `/projects/${project.id}` || activeId === project.id;
              const agentStatus = (project as any).agentStatus || 'idle';
              const statusClass = getAgentStatusClass(agentStatus);

              return (
                <a
                  key={project.id}
                  href={`/projects/${project.id}`}
                  onClick={(e) => {
                    if (onProjectSelect) {
                      e.preventDefault();
                      onProjectSelect(project);
                    }
                  }}
                  className={`
                    block cursor-pointer ios-radius p-[13px] transition-colors
                    ${isProjectActive
                      ? 'bg-ios-blue text-white'
                      : 'bg-ios-bg-card hover:bg-ios-secondary text-ios-text-primary border border-ios-border'
                    }
                  `}
                >
                  <div className="flex items-start justify-between ios-font-text">
                    <div className="flex items-center gap-2.5 max-w-[150px]">
                      {/* Agent Status Dot */}
                      <div className={`ios-status-dot ${statusClass}`} title={`Agent status: ${agentStatus}`} />
                      <span className="text-lg">📁</span>
                      <h3 className="text-[17px] font-medium truncate" title={project.name}>
                        {project.name}
                      </h3>
                    </div>
                    {isProjectActive && (
                      <span className="bg-white/20 text-white text-[13px] px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                </a>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-opacity-12 mt-auto" style={{ borderColor: 'var(--ios-separator)' }}>
            <div className="flex gap-2">
              <a
                href="/settings"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium text-ios-blue bg-ios-secondary border border-ios ios-radius transition-colors ios-font-text"
              >
                <span className="text-base">⚙️</span>
                <span>Settings</span>
              </a>
              <div className="flex-1 min-w-0">
                <CreateProjectDialog onProjectCreated={onProjectCreated} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
