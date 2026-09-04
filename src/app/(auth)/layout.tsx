import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { authInstance } from '@/lib/auth';
import { headers } from 'next/headers';

async function AuthCheck({ children }: { children: React.ReactNode }) {
  const session = await authInstance.api.getSession({
    headers: await headers(),
  });
  if (session) redirect('/');
  return <>{children}</>;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-base flex min-h-screen items-center justify-center">
      <Suspense fallback={null}>
        <AuthCheck>{children}</AuthCheck>
      </Suspense>
    </div>
  );
}
