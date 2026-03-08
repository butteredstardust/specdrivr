import type { Metadata } from "next";
import { getProjects, getProjectById } from '@/lib/actions';
import { ProjectSettingsClient } from './client-page';
import { notFound } from 'next/navigation';

interface SettingsPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: 'Specdrivr', robots: 'noindex' };

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { id } = await params;
  const projectId = parseInt(id, 10);

  if (isNaN(projectId)) {
    return notFound();
  }

  const projectsResult = await getProjects();
  let projects: any[] = [];
  if (projectsResult.success && projectsResult.projects) {
    projects = projectsResult.projects;
  }

  const result = await getProjectById(projectId);

  if (!result.success || !result.context) {
    return notFound();
  }

  const { project } = result.context;

  return (
    <ProjectSettingsClient
      projectId={projectId}
      project={project}
      projects={projects}
    />
  );
}
