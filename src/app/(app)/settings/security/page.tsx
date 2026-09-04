import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ChangePasswordSection } from '@/components/settings/change-password-section';
import { ActiveSessionsSection } from '@/components/settings/active-sessions-section';
import { ApiTokensSection } from '@/components/settings/api-tokens-section';

export default async function SecurityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h2 className="text-fg-muted font-mono text-[10px] tracking-[0.2em] uppercase">Security</h2>
      <ChangePasswordSection />
      <ActiveSessionsSection />
      <ApiTokensSection />
    </div>
  );
}
