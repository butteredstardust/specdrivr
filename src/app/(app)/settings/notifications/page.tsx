import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { NotificationPreferencesSection } from '@/components/settings/notification-preferences-section';

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h1 className="text-foreground text-lg font-semibold">NOTIFICATIONS</h1>
      <NotificationPreferencesSection />
    </div>
  );
}
