import { getProjects, getProjectById } from '@/lib/actions';
import { KanbanBoard } from '@/components/kanban-board';
import { InlineSpecEditor } from '@/components/inline-spec-editor';
import { InlineConstitutionEditor } from '@/components/inline-constitution-editor';
import { InlineTechStackEditor } from '@/components/inline-tech-stack-editor';
import { ActionBar } from '@/components/action-bar';
import { TestResultsPanel } from '@/components/test-results-panel';
import { AgentLogs } from '@/components/agent-logs';
import { ProjectSidebarWrapper } from '@/components/project-sidebar-wrapper';
import { Logo } from '@/components/logo';
import { DatabaseStatus } from '@/components/database-status';
import { UserMenu } from '@/components/user-menu';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
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

  // Get all projects for the sidebar
  const projectsResult = await getProjects();
  let projects: any[] = [];
  if (projectsResult.success && projectsResult.projects) {
    projects = projectsResult.projects;
  }

  // Get the specific project data
  const result = await getProjectById(projectId);

  if (!result.success || !result.context) {
    return notFound();
  }

  const { project, specification, plan, tasks: projectTasks } = result.context;

  // Fetch plans for this project to pass to Kanban and task creation
  const projectPlans = specification ? await db.select().from(plans).where(eq(plans.specId, specification.id)) : [];

  // Extract and cast values to proper types
  const projectConstitution = project.constitution as string | null;
  const projectTechStack: Record<string, unknown> = (project.techStack as Record<string, unknown>) || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Logo size="large" className="min-w-48" />
              {project.basePath && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{project.basePath}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <DatabaseStatus />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen pt-0">
        <ProjectSidebarWrapper
          projects={projects}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
        {/* Project Constitution */}
        <div className="mb-8">
          <InlineConstitutionEditor
            projectId={projectId}
            constitution={projectConstitution}
          />
        </div>
        {/* Tech Stack */}
        <div className="mb-8">
          <InlineTechStackEditor
            projectId={projectId}
            techStack={projectTechStack}
          />
        </div>
        {/* Specification */}
        {specification && (
          <div className="mb-8">
            <InlineSpecEditor specification={specification} />
          </div>
        )}

        {/* Tasks Kanban Board */}
        {projectTasks && (
          <div className="mb-8">
            <ActionBar
              projectId={projectId}
              plans={projectPlans}
              existingTasks={projectTasks}
            />
            <KanbanBoard tasks={projectTasks} />
          </div>
        )}

        {/* Test Results */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Test Results</h2>
          <TestResultsPanel testResults={[]} />
        </div>

        {/* Agent Logs */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Agent Logs</h2>
          <AgentLogs logs={[]} />
        </div>
      </div>
    </main>
  </div>
</div>
  );
}
