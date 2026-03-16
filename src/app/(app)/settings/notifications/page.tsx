import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { NotificationPreferencesSection } from '@/components/settings/notification-preferences-section';

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h2 className="text-text-muted font-mono text-xs tracking-widest uppercase">NOTIFICATIONS</h2>
      <NotificationPreferencesSection />
    </div>
  );
}
