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
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[rgba(255,255,255,0.8)] dark:bg-[rgba(28,28,30,0.8)] backdrop-blur-md border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.65)]">
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
        <ProjectSidebarWrapper
          projects={projects}
        />

        <main className="flex-1 overflow-y-auto bg-[#F2F2F7] dark:bg-black">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {/* iOS-style Large Title */}
            <div className="mb-8">
              <h1 className="text-[34px] font-bold text-black dark:text-white mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif' }}>
                {project.name}
              </h1>
            </div>

            {/* Project Constitution */}
            <div className="mb-6">
              <InlineConstitutionEditor
                projectId={projectId}
                constitution={projectConstitution}
              />
            </div>

            {/* Tech Stack */}
            <div className="mb-6">
              <InlineTechStackEditor
                projectId={projectId}
                techStack={projectTechStack}
              />
            </div>

            {/* Specification */}
            {specification && (
              <div className="mb-6">
                <InlineSpecEditor specification={specification} />
              </div>
            )}

            {/* Tasks Kanban Board */}
            {projectTasks && (
              <>
                <ActionBar
                  projectId={projectId}
                  plans={projectPlans}
                  existingTasks={projectTasks}
                />
                <div className="mb-6">
                  <KanbanBoard tasks={projectTasks} />
                </div>
              </>
            )}

            {/* Test Results */}
            <div className="mb-6">
              <h2 className="text-[13px] font-semibold text-[#3C3C43]/[0.6] dark:text-[#FFFFFF]/[0.6] uppercase tracking-wide mb-2 px-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}>
                Test Results
              </h2>
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[12px] overflow-hidden shadow-sm border border-[#C6C6C829] dark:border-[#38383A52]">
                <div className="px-4 py-[13px]">
                  <TestResultsPanel testResults={[]} />
                </div>
              </div>
            </div>

            {/* Agent Logs */}
            <div className="mb-6">
              <h2 className="text-[13px] font-semibold text-[#3C3C43]/[0.6] dark:text-[#FFFFFF]/[0.6] uppercase tracking-wide mb-2 px-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}>
                Agent Logs
              </h2>
              <div className="bg-white dark:bg-[#1C1C1E] rounded-[12px] overflow-hidden shadow-sm border border-[#C6C6C829] dark:border-[#38383A52]">
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
