import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session) redirect('/');
  return (
    <div className="flex min-h-screen items-center justify-center bg-[--bg-base]">{children}</div>
  );
}
