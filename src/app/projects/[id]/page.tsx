import { getProjects, getProjectById, getProjectSpecs } from '@/lib/actions';
import { KanbanBoard } from '@/components/kanban-board';
import { InlineSpecEditor } from '@/components/inline-spec-editor';
import { InlineConstitutionEditor } from '@/components/inline-constitution-editor';
import { InlineTechStackEditor } from '@/components/inline-tech-stack-editor';
import { InlinePlanEditor } from '@/components/inline-plan-editor';
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

  const projectConstitution = project.constitution as string | null;
  const projectTechStack: Record<string, unknown> = (project.techStack as Record<string, unknown>) || {};

  return (
    <div className="min-h-screen bg-ios-system">
      <header className="sticky top-0 z-50 ios-header border-b ios">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Logo size="large" className="min-w-40" />
            </div>
            <div className="flex items-center gap-3">
              <DatabaseStatus />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen pt-0">
        <ProjectSidebarWrapper projects={projects} />

        <main className="flex-1 overflow-y-auto bg-ios-system ios-font">
          <div className="max-w-3xl mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="ios-title-large text-ios-primary ios-font-display">
                {project.name}
              </h1>
            </div>

            <div className="mb-6">
              <InlineConstitutionEditor
                projectId={projectId}
                constitution={projectConstitution}
              />
            </div>

            <div className="mb-6">
              <InlineTechStackEditor
                projectId={projectId}
                techStack={projectTechStack}
              />
            </div>

            {specification && (
              <div className="mb-6">
                <InlinePlanEditor
                  specId={specification.id}
                  plans={projectPlans}
                />
              </div>
            )}

            {specification && (
              <div className="mb-6">
                <InlineSpecEditor
                  specification={specification}
                  allSpecs={allSpecs}
                />
              </div>
            )}

            {projectTasks && (
              <>
                <ActionBar
                  projectId={projectId}
                  plans={projectPlans}
                  existingTasks={projectTasks}
                />
                <div className="mb-6">
                  <KanbanBoard
                    projectId={projectId}
                    plans={projectPlans}
                    tasks={projectTasks}
                  />
                </div>
              </>
            )}

            <div className="mb-6">
              <h2 className="ios-footnote ios-placeholder mb-2 px-4 uppercase tracking-wide ios-font-text">
                Test Results
              </h2>
              <div className="ios-card shadow-sm ios">
                <div className="px-4 py-[13px]">
                  <TestResultsPanel testResults={[]} />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="ios-footnote ios-placeholder mb-2 px-4 uppercase tracking-wide ios-font-text">
                Agent Logs
              </h2>
              <div className="ios-card shadow-sm ios">
                <div className="px-4 py-[13px]">
                  <AgentLogs logs={[]} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
