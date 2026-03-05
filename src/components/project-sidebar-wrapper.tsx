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

  const handleProjectSelect = (project: ProjectSelect) => {
    // Navigate immediately - layout is fixed so we don't need to close anything
    // Link itself handles the navigation, this is just a callback if needed
  };

  return (
    <ProjectSidebar
      projects={projects}
      currentProjectId={currentProjectId}
      onProjectSelect={handleProjectSelect}
    />
  );
}
