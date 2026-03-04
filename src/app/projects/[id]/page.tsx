import { getProjects, getProjectById, getProjectSpecs } from '@/lib/actions';
import { ProjectDetailClient } from './client-page';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { plans } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
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

  const { project, specification, plan, tasks: projectTasks } = result.context;
  const projectPlans = specification ? await db.select().from(plans).where(eq(plans.specId, specification.id)) : [];
  const allSpecs = specification ? (await getProjectSpecs(projectId)).specs || [] : [];
  const hasActivePlan = projectPlans.some(p => p.status === 'active');

  return (
    <ProjectDetailClient
      projectId={projectId}
      project={project}
      specification={specification}
      plans={projectPlans}
      allSpecs={allSpecs}
      tasks={projectTasks || []}
      projects={projects}
      hasActivePlan={hasActivePlan}
    />
  );
}
