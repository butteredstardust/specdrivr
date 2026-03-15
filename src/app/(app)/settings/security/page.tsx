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
      <h1 className="text-foreground text-lg font-semibold">SECURITY</h1>
      <ChangePasswordSection />
      <ActiveSessionsSection />
      <ApiTokensSection />
    </div>
  );
}
