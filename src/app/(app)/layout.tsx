import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { ShellProvider } from '@/components/shell/shell-context';
import { Sidebar } from '@/components/shell/sidebar';
import { TopBar } from '@/components/shell/top-bar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const projects = await projectRepository.getByUserId(session.user.id);

  const shellUser = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role ?? undefined,
    onboardingStep: session.user.onboardingStep ?? undefined,
  };

  // TODO: OnboardingWizard will be implemented in Task 18
  // For now, conditionally render once it exists
  const showOnboarding = session.user.onboardingStep === 0;

  return (
    <ShellProvider user={shellUser}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar projects={projects} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
      {showOnboarding && null /* <OnboardingWizard user={shellUser} /> - Task 18 */}
    </ShellProvider>
  );
}
