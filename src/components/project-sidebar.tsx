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
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
        <p className="text-sm text-gray-500">Track AI agent progress</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-2">
          {projects.map((project) => {
            const isActive = activeProjectId === project.id;
            return (
              <div
                key={project.id}
                className={`
                  cursor-pointer rounded-lg p-3 transition-colors
                  ${isActive
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                  }
                `}
                onClick={() => onProjectSelect && onProjectSelect(project)}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  {isActive && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Active
                    </span>
                  )}
                </div>
                {project.basePath && (
                  <p className="text-xs text-gray-500 mt-1">{project.basePath}</p>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200">
        <nav className="space-y-2">
          <a
            href="/settings"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-lg">⚙️</span>
            <span>Settings</span>
          </a>
        </nav>
        <div className="mt-3">
          <CreateProjectDialog onProjectCreated={onProjectCreated} />
        </div>
      </div>
    </div>
  );
}
