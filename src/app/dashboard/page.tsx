import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
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

  if (!session) {
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
              <Button variant="ghost" size="icon">
                <MoonIcon className="h-5 w-5" />
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={session.user.image || undefined} />
                      <AvatarFallback>
                        {session.user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                      <Badge variant="outline" className="self-start text-xs mt-1">
                        {session.user.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <PersonIcon className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <GearIcon className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <ExitIcon className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
          <StatCard
            label="Active Projects"
            value={activeProjects.length}
            icon={FolderIcon}
            description={`${allProjects.length} total projects`}
          />
          <StatCard
            label="Pending Tasks"
            value={pendingTasks.length}
            icon={ClockIcon}
            description={`${inProgressTasks.length} in progress`}
            variant="warning"
          />
          <StatCard
            label="Blocked Items"
            value={blockedTasks.length}
            icon={ExclamationTriangleIcon}
            description="Requires attention"
            variant="danger"
          />
          <StatCard
            label="Completed"
            value={completedTasks.length}
            icon={CheckCircledIcon}
            description={`${completedPercentage}% complete`}
            variant="success"
          />
        </div>

        {/* Progress overview */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>Task completion across all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Progress</span>
                <span className="font-medium">{completedPercentage}%</span>
              </div>
              <Progress value={completedPercentage} className="h-3" />
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
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Projects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Projects</CardTitle>
                  <CardDescription>Projects you&apos;re currently working on</CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <PlusIcon className="mr-1 h-4 w-4" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
                      <Badge variant="outline">{project.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="w-full" asChild>
                <a href="/projects">View all projects</a>
              </Button>
            </CardFooter>
          </Card>

          {/* Recent Specifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Specifications</CardTitle>
                  <CardDescription>Latest specs and plans</CardDescription>
                </div>
                <Button size="sm" variant="outline">
                  <PlusIcon className="mr-1 h-4 w-4" />
                  Create
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Specification</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSpecs.slice(0, 5).map((spec) => (
                    <TableRow key={spec.id}>
                      <TableCell className="font-medium">{spec.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={spec.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="w-full" asChild>
                <a href="/specifications">View all specifications</a>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Blocked Tasks Alert */}
        {blockedTasks.length > 0 && (
          <Card className="border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                <ExclamationTriangleIcon className="h-5 w-5" />
                Blocked Tasks Need Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                    <Badge variant="outline" className="text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/50">
                      Blocked
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <a href="/tasks?status=blocked">View all blocked tasks</a>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  description,
  variant = 'default',
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const variantStyles = {
    default: 'text-primary',
    success: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    warning: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
    danger: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${variantStyles[variant]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
    drafting: { variant: 'outline', label: 'Drafting' },
    pending_plan: { variant: 'secondary', label: 'Planning' },
    pending_approval: { variant: 'outline', label: 'Review' },
    executing: { variant: 'default', label: 'Executing' },
    complete: { variant: 'outline', label: 'Complete' },
    stalled: { variant: 'destructive', label: 'Stalled' },
    archived: { variant: 'secondary', label: 'Archived' },
  };

  const config = statusMap[status] || { variant: 'outline', label: status };

  return <Badge variant={config.variant}>{config.label}</Badge>;
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
