'use client';

import { useRouter } from 'next/navigation';
import { ProjectSidebar } from './project-sidebar';
import { ProjectSelect } from '@/db/schema';

interface ProjectSidebarWrapperProps {
  projects: ProjectSelect[];
}

export function ProjectSidebarWrapper({ projects }: ProjectSidebarWrapperProps) {
  const router = useRouter();

  const handleProjectSelect = (project: ProjectSelect) => {
    router.push(`/projects/${project.id}`);
  };

  return <ProjectSidebar projects={projects} onProjectSelect={handleProjectSelect} />;
}
