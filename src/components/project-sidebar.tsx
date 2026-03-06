'use client';

import { ProjectSelect } from '@/db/schema';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Layout,
  Database,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectSidebarProps {
  projects: ProjectSelect[];
  currentProjectId?: number;
  onProjectCreated?: (project: ProjectSelect) => void;
}

export function ProjectSidebar({ projects, currentProjectId, onProjectCreated }: ProjectSidebarProps) {
  const pathname = usePathname();
  const activeId = currentProjectId;

  const NavItem = ({ href, icon: Icon, label, active }: { href: string, icon: React.ElementType, label: string, active: boolean }) => (
    <Link
      href={href}
      className={cn(
        "flex items-center h-[32px] px-[var(--sp-2)] rounded-[var(--radius-md)] gap-[var(--sp-2)] text-[12px] font-medium transition-all duration-80",
        active
          ? "bg-[var(--bg-selected)] text-[var(--brand-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-hovered)] hover:text-[var(--text-primary)]"
      )}
    >
      <Icon size={16} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Projects Section Label */}
      <div className="mt-[var(--sp-4)] mb-[var(--sp-1)] px-[var(--sp-2)] py-[var(--sp-2)]">
        <span className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
          Projects
        </span>
      </div>

      {/* Projects List */}
      <div className="space-y-0.5 mb-[var(--sp-4)]">
        {projects.map((project) => {
          const isActive = pathname.startsWith(`/projects/${project.id}`) || activeId === project.id;
          const agentStatus = (project as any).agentStatus || 'idle';

          const statusColors: Record<string, string> = {
            running: 'bg-[#4ADE80]',
            paused: 'bg-[#FFAB00]',
            error: 'bg-[#AE2A19]',
            idle: 'bg-[#DFE1E6]',
          };

          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className={cn(
                "flex items-center h-[32px] px-[var(--sp-2)] rounded-[var(--radius-md)] gap-[var(--sp-2)] text-[12px] transition-all duration-80 relative",
                isActive
                  ? "bg-[var(--bg-selected)] text-[var(--brand-primary)] font-semibold"
                  : "text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-hovered)] hover:text-[var(--text-primary)]"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--brand-primary)]" />
              )}
              <div
                className={cn("w-[8px] h-[8px] rounded-full shrink-0", statusColors[agentStatus] || 'bg-[#DFE1E6]')}
              />
              <span className="truncate">{project.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Create Project Button */}
      <div className="mt-auto pt-[var(--sp-4)] pb-[var(--sp-2)] px-0 border-t border-[var(--border-default)]">
        <button
          onClick={() => {
            if (pathname !== '/') {
              window.location.href = '/?newProject=true';
            } else {
              window.dispatchEvent(new CustomEvent('open-new-project-modal'));
            }
          }}
          className="bg-[var(--brand-primary)] text-[#FFFFFF] h-[32px] w-[calc(100%-16px)] mx-[8px] my-0 rounded-[var(--radius-md)] border-none text-[13px] font-medium flex items-center justify-center gap-[6px] cursor-pointer hover:bg-[var(--brand-primary-hover)]"
        >
          <Plus size={14} />
          <span className="mt-[1px]">New Project</span>
        </button>
      </div>
    </div>
  );
}
