'use client';

import { useRouter } from 'next/navigation';
import { ProjectSidebar } from './project-sidebar';
import { ProjectSelect } from '@/db/schema';

// We removed the context/toggle state since Linear sidebar is fixed 220px and never collapses on desktop.

interface ProjectSidebarWrapperProps {
  projects: ProjectSelect[];
  currentProjectId?: number;
}

export function ProjectSidebarWrapper({ projects, currentProjectId }: ProjectSidebarWrapperProps) {
  const router = useRouter();

  return (
    <ProjectSidebar
      projects={projects}
      currentProjectId={currentProjectId}
    />
  );
}
