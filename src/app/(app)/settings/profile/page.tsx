import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { ProfileForm } from '@/components/settings/profile-form';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <h1 className="text-text-muted font-mono text-xs tracking-widest uppercase">PROFILE</h1>
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
