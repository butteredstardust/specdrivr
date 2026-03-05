import { getProjects, getProjectById, getProjectCommits } from '@/lib/actions';
import { ProjectCommitsClient } from './client-page';
import { notFound } from 'next/navigation';

interface CommitsPageProps {
  params: {
    id: string;
  };
}

export default async function CommitsPage({ params }: CommitsPageProps) {
  const projectId = parseInt(params.id, 10);

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

  // Fetch commits for this project
  const commitsResult = await getProjectCommits(projectId, 100);
  const commits = commitsResult.success ? commitsResult.commits || [] : [];

  return (
    <ProjectCommitsClient
      projectId={projectId}
      project={project}
      projects={projects}
      commits={commits}
    />
  );
}
