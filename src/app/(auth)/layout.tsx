import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session) redirect('/');
  return <div className="bg-bg-base flex min-h-screen items-center justify-center">{children}</div>;
}
