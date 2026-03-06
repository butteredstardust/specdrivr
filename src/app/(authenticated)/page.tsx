import { getProjects, getTasksDoneToday } from '@/lib/actions';
import { DashboardSummaryCard } from '@/components/project-card';
import { DashboardProjectList } from '@/components/dashboard-project-list';
import { AppShell } from '@/components/app-shell';
import { Layout, Radio, CheckSquare } from 'lucide-react';

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
      <div className="mb-6">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-[14px] text-[var(--text-secondary)] mt-1">Overview of all your architectural projects</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-[16px] mb-[20px]">
        <DashboardSummaryCard
          value={totalProjects}
          label="Projects"
          icon={<Layout size={20} />}
          accentColor="#4F46E5"
        />
        <DashboardSummaryCard
          value={agentsRunning}
          label="Agents Running"
          icon={<Radio size={20} />}
          accentColor="#7C3AED"
        />
        <DashboardSummaryCard
          value={tasksDoneToday}
          label="Tasks Done Today"
          icon={<CheckSquare size={20} />}
          accentColor="#059669"
        />
      </div>

      <DashboardProjectList projects={projects} />
    </>
  );
}
