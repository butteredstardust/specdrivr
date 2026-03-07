'use client';

import { ProjectSelect } from '@/db/schema';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Layout,
  Settings,
  ChevronLeft,
  ChevronRight,
  Database,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectSidebarProps {
  projects: ProjectSelect[];
  currentProjectId?: number;
  onProjectCreated?: (project: ProjectSelect) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ProjectSidebar({
  projects,
  currentProjectId,
  onProjectCreated,
  isCollapsed = false,
  onToggleCollapse
}: ProjectSidebarProps) {
  const pathname = usePathname();
  const activeId = currentProjectId;

  const NavItem = ({ href, icon: Icon, label, active }: { href: string, icon: React.ElementType, label: string, active: boolean }) => (
    <Link
      href={href}
      title={isCollapsed ? label : undefined}
      className={cn(
        "flex items-center h-[32px] rounded-[var(--radius-md)] gap-[var(--sp-2)] text-[12px] font-medium transition-all duration-80",
        isCollapsed ? "w-[32px] justify-center mx-auto px-0" : "w-full px-[var(--sp-2)]",
        active
          ? "bg-[var(--bg-selected)] text-[var(--brand-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-hovered)] hover:text-[var(--text-primary)]"
      )}
    >
      <Icon size={16} className="shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Top Section: Toggle Collapse */}
      <div className={cn("flex items-center pt-[var(--sp-4)] pb-[var(--sp-2)]", isCollapsed ? "justify-center" : "justify-between px-[var(--sp-4)]")}>
        {!isCollapsed && <span className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider opacity-0 cursor-default select-none">Menu</span>}
        <button
          onClick={onToggleCollapse}
          className="w-[24px] h-[24px] rounded-[var(--radius-sm)] hover:bg-[var(--bg-hovered)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className={cn("space-y-[2px] mb-[var(--sp-4)]", isCollapsed ? "px-0" : "px-[var(--sp-2)]")}>
        <NavItem href="/" icon={Layout} label="Dashboard" active={pathname === '/'} />
        <NavItem href="/settings" icon={Settings} label="Settings" active={pathname.startsWith('/settings')} />
      </div>

      {/* Projects Section Label */}
      <div className={cn("mb-[var(--sp-1)] py-[var(--sp-2)]", isCollapsed ? "px-0 text-center" : "px-[var(--sp-4)]")}>
        {!isCollapsed ? (
          <span className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
            Projects
          </span>
        ) : (
          <span className="w-[16px] h-[1px] bg-[var(--border-default)] inline-block" />
        )}
      </div>

      {/* Projects List */}
      <div className={cn("space-y-0.5 mb-[var(--sp-4)] flex-1 overflow-y-auto", isCollapsed ? "px-0" : "px-[var(--sp-2)]")}>
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
              title={isCollapsed ? project.name : undefined}
              className={cn(
                "flex items-center h-[32px] rounded-[var(--radius-md)] gap-[var(--sp-2)] text-[12px] transition-all duration-80 relative",
                isCollapsed ? "w-[32px] justify-center mx-auto px-0" : "w-full px-[var(--sp-2)]",
                isActive
                  ? "bg-[var(--bg-selected)] text-[var(--brand-primary)] font-semibold"
                  : "text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-hovered)] hover:text-[var(--text-primary)]"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--brand-primary)] rounded-r-[1px]" />
              )}
              <div
                className={cn("w-[8px] h-[8px] rounded-full shrink-0", statusColors[agentStatus] || 'bg-[var(--text-tertiary)]')}
              />
              {!isCollapsed && <span className="truncate">{project.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* Create Project Button */}
      <div className="mt-auto pt-[var(--sp-4)] pb-[var(--sp-4)] px-0 border-t border-[var(--border-default)]">
        <button
          onClick={() => {
            if (pathname !== '/') {
              window.location.href = '/?newProject=true';
            } else {
              window.dispatchEvent(new CustomEvent('open-new-project-modal'));
            }
          }}
          title={isCollapsed ? "New Project" : undefined}
          className={cn(
            "bg-[var(--brand-primary)] text-[#FFFFFF] h-[32px] rounded-[var(--radius-md)] border-none text-[13px] font-medium flex items-center justify-center gap-[6px] cursor-pointer hover:bg-[var(--brand-primary-hover)] transition-all",
            isCollapsed ? "w-[32px] mx-auto px-0" : "w-[calc(100%-16px)] mx-[8px] my-0"
          )}
        >
          <Plus size={14} className="shrink-0" />
          {!isCollapsed && <span className="mt-[1px] whitespace-nowrap">New Project</span>}
        </button>
      </div>
    </div>
  );
}
