import { getProjects, getTasksDoneToday } from '@/lib/actions';
import { DashboardSummaryCard } from '@/components/project-card';
import { DashboardProjectList } from '@/components/dashboard-project-list';
import { AppShell } from '@/components/app-shell';
import { Layout, Radio, CheckSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateProjectDialog } from '@/components/create-project-dialog';

export default async function Home() {
  const result = await getProjects();

  let projects: any[] = [];
  if (result.success && result.projects) {
    projects = result.projects;
  }

  const totalProjects = projects.length;
  const agentsRunning = projects.filter((p: any) => p.agentStatus === 'running').length;
  const tasksDoneToday = await getTasksDoneToday();

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)]">Dashboard</h1>
          <p className="text-[14px] text-[var(--color-text-secondary)] mt-1">Overview of all your architectural projects</p>
        </div>
        <CreateProjectDialog />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <DashboardSummaryCard
          value={totalProjects}
          label="Projects"
          icon={<Layout size={16} />}
        />
        <DashboardSummaryCard
          value={agentsRunning}
          label="Agents Running"
          icon={<Radio size={16} />}
        />
        <DashboardSummaryCard
          value={tasksDoneToday}
          label="Tasks Done Today"
          icon={<CheckSquare size={16} />}
        />
      </div>

      <DashboardProjectList projects={projects} />
    </>
  );
}
