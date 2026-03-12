import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { ShellProvider } from '@/components/providers/shell-provider';
import { Sidebar } from '@/components/shell/sidebar';
import { TopBar } from '@/components/shell/top-bar';
import { KeyboardShortcutsWrapper } from '@/components/shell/keyboard-shortcuts-wrapper';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    // Basic redirect fallback if unauthenticated
    redirect('/login');
  }

  return (
    <ShellProvider user={{ id: session.user.id, name: session.user.name, email: session.user.email, avatarUrl: session.user.image || undefined }}>
      <div className="flex h-screen bg-[--bg-base] overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <TopBar title="SPECDRIVR" />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>

      <KeyboardShortcutsWrapper />
    </ShellProvider>
  );
}
