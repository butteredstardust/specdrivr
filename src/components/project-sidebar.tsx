'use client';

import { ProjectSelect } from '@/db/schema';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Settings,
  Plus,
  Layout,
  Database,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateProjectDialog } from './create-project-dialog';

interface ProjectSidebarProps {
  projects: ProjectSelect[];
  currentProjectId?: number;
  onProjectCreated?: (project: ProjectSelect) => void;
}

export function ProjectSidebar({ projects, currentProjectId, onProjectCreated }: ProjectSidebarProps) {
  const pathname = usePathname();
  const activeId = currentProjectId;

  const NavItem = ({ href, icon: Icon, label, active }: { href: string, icon: any, label: string, active: boolean }) => (
    <Link
      href={href}
      className={cn(
        "flex items-center h-[32px] px-[var(--sp-2)] rounded-[var(--radius-md)] gap-[var(--sp-2)] text-[12px] font-medium transition-all duration-80",
        active
          ? "bg-[var(--color-bg-selected)] text-[var(--color-brand-bold)]"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hovered)] hover:text-[var(--color-text-primary)]"
      )}
    >
      <Icon size={16} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Global Navigation Section */}
      <div className="space-y-0.5">
        <NavItem
          href="/"
          icon={Home}
          label="Dashboard"
          active={pathname === '/'}
        />
        <NavItem
          href="/settings"
          icon={Settings}
          label="Settings"
          active={pathname === '/settings'}
        />
      </div>

      {/* Projects Section Label */}
      <div className="mt-[var(--sp-4)] mb-[var(--sp-1)] px-[var(--sp-2)] py-[var(--sp-2)]">
        <span className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
          Projects
        </span>
      </div>

      {/* Projects List */}
      <div className="space-y-0.5 mb-[var(--sp-4)]">
        {projects.map((project) => {
          const isActive = pathname.startsWith(`/projects/${project.id}`) || activeId === project.id;
          const agentStatus = (project as any).agentStatus || 'idle';

          const statusColors: Record<string, string> = {
            running: 'bg-[#57D9A3]',
            paused: 'bg-[#FFAB00]',
            error: 'bg-[#AE2A19]',
            idle: 'bg-[#DFE1E6]',
          };

          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className={cn(
                "flex items-center h-[32px] px-[var(--sp-2)] rounded-[var(--radius-md)] gap-[var(--sp-2)] text-[12px] font-medium transition-all duration-80 relative",
                isActive
                  ? "bg-[var(--color-bg-selected)] text-[var(--color-brand-bold)] font-semibold"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hovered)] hover:text-[var(--color-text-primary)]"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-[var(--sp-2)] bottom-[var(--sp-2)] w-[2px] bg-[var(--color-brand-bold)] rounded-sm" />
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
      <div className="mt-auto pt-[var(--sp-4)] px-[var(--sp-1)]">
        <CreateProjectDialog onProjectCreated={onProjectCreated} />
      </div>
    </div>
  );
}
