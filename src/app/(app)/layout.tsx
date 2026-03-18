import { Suspense } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authInstance } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { ShellProvider } from '@/components/shell/shell-context';
import { Sidebar } from '@/components/shell/sidebar';
import { TopBar } from '@/components/shell/top-bar';
import { OnboardingWizard } from '@/components/onboarding-wizard';
import { TaskDrawerProvider } from '@/components/shell/task-drawer-context';
import { TaskDrawer } from '@/components/tasks/task-drawer';
import { KeyboardShortcutsModal } from '@/components/ui/keyboard-shortcuts-modal';
import { Skeleton } from '@/components/ui/skeleton';

async function AuthenticatedApp({ children }: { children: React.ReactNode }) {
  const session = await authInstance.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) redirect('/login');

  const projects = await projectRepository.getByUserId(session.user.id);
  const cookieStore = await cookies();
  const activeProjectId = cookieStore.get('active-project-id')?.value;

  // Validate the active project ID
  let validatedProjectId: number | null = null;
  if (activeProjectId) {
    const id = parseInt(activeProjectId, 10);
    if (projects.some((p) => p.id === id)) {
      validatedProjectId = id;
    }
  }

  // Fallback to first project if none valid
  if (validatedProjectId === null && projects.length > 0) {
    validatedProjectId = projects[0].id;
  }

  const shellUser = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role ?? undefined,
    onboardingStep: session.user.onboardingStep ?? undefined,
  };

  const showOnboarding = session.user.onboardingStep === 0;

  return (
    <ShellProvider user={shellUser} initialId={validatedProjectId}>
      <TaskDrawerProvider>
        <div className="relative flex h-screen overflow-hidden">
          <Sidebar projects={projects} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
        {showOnboarding && <OnboardingWizard user={shellUser} />}
        <TaskDrawer />
        <KeyboardShortcutsModal />
      </TaskDrawerProvider>
    </ShellProvider>
  );
}

function LayoutSkeleton() {
  return (
    <div className="relative flex h-screen overflow-hidden">
      <div className="border-border-default bg-bg-surface w-56 space-y-4 border-r p-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-border-default flex h-14 items-center justify-between border-b p-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LayoutSkeleton />}>
      <AuthenticatedApp>{children}</AuthenticatedApp>
    </Suspense>
  );
}
