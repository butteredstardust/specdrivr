import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ChangePasswordSection } from '@/components/settings/change-password-section';
import { ActiveSessionsSection } from '@/components/settings/active-sessions-section';
import { ApiTokensSection } from '@/components/settings/api-tokens-section';

export default async function SecurityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <h2 className="text-fg text-lg font-semibold">Security</h2>
      <ChangePasswordSection />
      <ActiveSessionsSection />
      <ApiTokensSection />
    </div>
  );
}
