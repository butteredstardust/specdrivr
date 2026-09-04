import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ProfileForm } from '@/components/settings/profile-form';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h2 className="text-fg-muted text-2xs">Profile</h2>
      <ProfileForm
        user={{
          id: session.user.id,
          name: session.user.name ?? '',
          email: session.user.email ?? '',
        }}
      />
    </div>
  );
}
