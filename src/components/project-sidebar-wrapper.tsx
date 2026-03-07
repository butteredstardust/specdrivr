'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectSidebar } from './project-sidebar';
import { ProjectSelect } from '@/db/schema';

interface ProjectSidebarWrapperProps {
  projects: ProjectSelect[];
  currentProjectId?: number;
}

export function ProjectSidebarWrapper({ projects, currentProjectId }: ProjectSidebarWrapperProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('specdrivr_sidebar_collapsed');
    if (stored) {
      setIsCollapsed(stored === 'true');
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('specdrivr_sidebar_collapsed', String(newState));
  };

  return (
    <aside
      className={`shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border-default)] overflow-y-auto min-h-[100vh] transition-[width] duration-200 ease-in-out ${isCollapsed ? 'w-[64px]' : 'w-[240px]'}`}
    >
      <ProjectSidebar
        projects={projects}
        currentProjectId={currentProjectId}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />
    </aside>
  );
}
