import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  PixelButton,
  PixelCard,
  PixelBadge,
  PixelProgress,
  PixelAvatar,
  PixelTable,
  PixelDropdown,
  PixelStatCard,
  PixelDivider,
} from '@pxlkit/ui-kit';
import { projectRepository } from '@/repositories/project-repository';
import { taskRepository } from '@/repositories/task-repository';
import { specificationRepository } from '@/repositories/specification-repository';
import {
  DashboardIcon,
  PersonIcon,
  GearIcon,
  CheckCircledIcon,
  ClockIcon,
  QuestionMarkCircledIcon,
  ExclamationTriangleIcon,
} from '@radix-ui/react-icons';

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  // Fetch real data
  const allProjects = await projectRepository.getAll();
  const activeProjects = await projectRepository.getActive();
  const pendingTasks = await taskRepository.getByStatus('todo');
  const inProgressTasks = await taskRepository.getByStatus('in_progress');
  const blockedTasks = await taskRepository.getByStatus('blocked');
  const completedTasks = await taskRepository.getByStatus('done');
  const recentSpecs = await specificationRepository.getAll();

  // Calculate system health
  const totalTasks = await taskRepository.getAll();
  const completedPercentage = totalTasks.length > 0
    ? Math.round((completedTasks.length / totalTasks.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DashboardIcon className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Theme toggle would go here */}
              <PixelButton variant="ghost" size="sm">
                <MoonIcon className="h-5 w-5" />
              </PixelButton>

              {/* User menu using PixelDropdown */}
              <PixelDropdown
                label={session.user.name || 'User'}
                icon={
                  <PixelAvatar
                    name={session.user.name || 'U'}
                    src={session.user.image || undefined}
                    size="sm"
                  />
                }
                items={[
                  { label: session.user.email || '', value: 'email', icon: <PersonIcon /> },
                  { label: 'Profile', value: 'profile', icon: <PersonIcon /> },
                  { label: 'Settings', value: 'settings', icon: <GearIcon /> },
                  { label: 'Sign out', value: 'signout', icon: <ExitIcon /> },
                ]}
                onSelect={(val) => {
                  if (val === 'signout') {
                    // Sign out logic
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Welcome section */}
        <div>
          <h2 className="text-2xl font-bold">Welcome back, {session.user.name}!</h2>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your projects today.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PixelStatCard
            label="Active Projects"
            value={activeProjects.length.toString()}
            icon={<FolderIcon />}
            trend={`${allProjects.length} total`}
          />
          <PixelStatCard
            label="Pending Tasks"
            value={pendingTasks.length.toString()}
            icon={<ClockIcon />}
            tone="gold"
            trend={`${inProgressTasks.length} in progress`}
          />
          <PixelStatCard
            label="Blocked Items"
            value={blockedTasks.length.toString()}
            icon={<ExclamationTriangleIcon />}
            tone="red"
            trend="Requires attention"
          />
          <PixelStatCard
            label="Completed"
            value={completedTasks.length.toString()}
            icon={<CheckCircledIcon />}
            tone="green"
            trend={`${completedPercentage}% complete`}
          />
        </div>

        {/* Progress overview */}
        <PixelCard title="Overall Progress">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Progress</span>
              <span className="font-medium">{completedPercentage}%</span>
            </div>
            <PixelProgress value={completedPercentage} tone="purple" />
            <div className="grid grid-cols-4 gap-4 pt-4 text-center">
              <div>
                <p className="text-2xl font-bold">{totalTasks.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
                <p className="text-xs text-muted-foreground">Done</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{inProgressTasks.length}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{pendingTasks.length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>
        </PixelCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Projects */}
          <PixelCard
            title="Active Projects"
            footer={
              <PixelButton variant="ghost" className="w-full">
                <a href="/projects">View all projects</a>
              </PixelButton>
            }
          >
            <div className="space-y-4">
              {activeProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active projects</p>
                </div>
              ) : (
                activeProjects.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-medium" style={{ backgroundColor: project.avatarColor || '#7c5cfc' }}>
                        {project.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.slug}</p>
                      </div>
                    </div>
                    <PixelBadge tone="neutral">{project.status}</PixelBadge>
                  </div>
                ))
              )}
            </div>
          </PixelCard>

          {/* Recent Specifications */}
          <PixelCard
            title="Recent Specifications"
            footer={
              <PixelButton variant="ghost" className="w-full">
                <a href="/specifications">View all specifications</a>
              </PixelButton>
            }
          >
            <PixelTable
              columns={[
                { key: 'name', header: 'Specification' },
                { key: 'status', header: 'Status' }
              ]}
              data={recentSpecs.slice(0, 5).map((spec) => ({
                id: spec.id,
                name: spec.name,
                status: <StatusBadge status={spec.status} />
              }))}
            />
          </PixelCard>
        </div>

        {/* Blocked Tasks Alert */}
        {blockedTasks.length > 0 && (
          <PixelCard
            title="Blocked Tasks Need Attention"
            icon={<ExclamationTriangleIcon />}
          >
            <div className="space-y-3">
              {blockedTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-start justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-start gap-3">
                    <QuestionMarkCircledIcon className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.blockedReason}</p>
                    </div>
                  </div>
                  <PixelBadge tone="red">Blocked</PixelBadge>
                </div>
              ))}
              <div className="pt-4">
                <PixelButton variant="ghost" className="w-full">
                  <a href="/tasks?status=blocked">View all blocked tasks</a>
                </PixelButton>
              </div>
            </div>
          </PixelCard>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { tone: 'neutral' | 'purple' | 'gold' | 'red' | 'green' | 'cyan'; label: string }> = {
    drafting: { tone: 'neutral', label: 'Drafting' },
    pending_plan: { tone: 'purple', label: 'Planning' },
    pending_approval: { tone: 'neutral', label: 'Review' },
    executing: { tone: 'cyan', label: 'Executing' },
    completed: { tone: 'green', label: 'Completed' },
    stalled: { tone: 'red', label: 'Stalled' },
    archived: { tone: 'neutral', label: 'Archived' },
  };

  const config = statusMap[status] || { tone: 'neutral', label: status };

  return <PixelBadge tone={config.tone}>{config.label}</PixelBadge>;
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 20h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 3.93 3H8a2 2 0 0 1 2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function ExitIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7Z" />
      <path d="M9 12h12" />
      <path d="m16 9 3 3-3 3" />
    </svg>
  );
}
