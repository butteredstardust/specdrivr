"use client";

import { ProjectSelect } from '@/db/schema';
import { CreateProjectDialog } from './create-project-dialog';

interface ProjectSidebarProps {
  projects: ProjectSelect[];
  activeProjectId?: number;
  onProjectSelect?: (project: ProjectSelect) => void;
  onProjectCreated?: (project: ProjectSelect) => void;
}

export function ProjectSidebar({ projects, activeProjectId, onProjectSelect, onProjectCreated }: ProjectSidebarProps) {
  return (
    <div className="w-64 bg-ios-system border-r border-ios h-screen flex flex-col ios-font">
      <div className="p-[13px] border-b border-opacity-12" style={{ borderColor: 'var(--ios-separator)' }}>
        <h2 className="text-[17px] font-semibold text-ios-primary mb-1 ios-font-display">
          Projects
        </h2>
        <p className="text-[13px] text-ios-placeholder ios-font-text">
          Track AI agent progress
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="p-3 space-y-2">
          {projects.map((project) => {
            const isActive = activeProjectId === project.id;
            return (
              <a
                key={project.id}
                href={`/projects/${project.id}`}
                className={`
                  block cursor-pointer ios-radius p-[13px] transition-colors
                  ${isActive
                    ? 'bg-ios-blue text-white'
                    : 'bg-ios-primary hover:bg-ios-secondary border border-ios'
                  }
                `}
              >
                <div className="flex items-start justify-between ios-font-text">
                  <h3 className="text-[17px] font-medium">
                    {project.name}
                  </h3>
                  {isActive && (
                    <span className="bg-white/20 text-white text-[13px] px-2 py-0.5 ios-radius-small">
                      Active
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-opacity-12" style={{ borderColor: 'var(--ios-separator)' }}>
        <div className="flex gap-2">
          <a
            href="/settings"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium text-ios-blue bg-ios-primary border border-ios ios-radius transition-colors ios-font-text"
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
  );
}
