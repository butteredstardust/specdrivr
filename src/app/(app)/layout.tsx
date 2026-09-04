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
import { ActiveJobsOverlay } from '@/components/shell/active-jobs-overlay';

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
        <div className="bg-surface-base relative flex h-screen overflow-hidden">
          <Sidebar projects={projects} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopBar />
            <main className="relative flex-1 overflow-y-auto px-4 py-6 [--shell-gutter-y:1.5rem] [--shell-gutter:1rem] md:px-8 md:py-8 md:[--shell-gutter-y:2rem] md:[--shell-gutter:2rem]">
              <div className="mx-auto max-w-[1600px]">{children}</div>
              <ActiveJobsOverlay />
            </main>
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
    <div className="bg-surface-base relative flex h-screen overflow-hidden">
      <div className="border-line bg-surface-raised w-64 shrink-0 border-r px-4 py-6">
        <Skeleton className="mb-6 h-8 w-3/4 rounded-md" />
        <div className="space-y-1.5">
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-line bg-surface-raised flex h-16 items-center justify-between border-b px-8">
          <Skeleton className="h-6 w-48 rounded" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-[1600px] space-y-6">
            <Skeleton className="h-10 w-1/4 rounded" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
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
