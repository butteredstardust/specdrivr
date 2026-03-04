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
    <div className="w-64 bg-[#F2F2F7] dark:bg-black border-r border-[#C6C6C8] dark:border-[#38383A] h-screen flex flex-col">
      {/* Sidebar Header - iOS style */}
      <div className="p-[13px] border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.65)]">
        <h2 className="text-[17px] font-semibold text-black dark:text-white mb-1" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif' }}>
          Projects
        </h2>
        <p className="text-[13px] text-[#8E8E93]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}>
          Track AI agent progress
        </p>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-3 space-y-2">
          {projects.map((project) => {
            const isActive = activeProjectId === project.id;
            return (
              <a
                key={project.id}
                href={`/projects/${project.id}`}
                className={`
                  block cursor-pointer rounded-[12px] p-[13px] transition-colors
                  ${isActive
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-white dark:bg-[#1C1C1E] hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C2E] border border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.65)]'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-[17px] font-medium" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}>
                    {project.name}
                  </h3>
                  {isActive && (
                    <span className="bg-white/20 text-white text-[13px] px-2 py-0.5 rounded-[8px]">
                      Active
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.65)]">
        <div className="flex gap-2">
          <a
            href="/settings"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium text-[#007AFF] hover:text-[#0056b3] bg-white dark:bg-[#1C1C1E] border border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.65)] rounded-[12px] transition-colors"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}
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
