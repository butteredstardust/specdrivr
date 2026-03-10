import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8">
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-400">Welcome back, {session.user.name}</p>
        </div>
        <div className="flex gap-4">
           {/* Add user menu here */}
           <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700"></div>
        </div>
      </header>
      <main className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold">Active Projects</h2>
          <p className="mt-2 text-3xl font-bold">--</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold">Pending Tasks</h2>
          <p className="mt-2 text-3xl font-bold">--</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold">System Health</h2>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-green-500">Operational</span>
          </div>
        </div>
      </main>
    </div>
  );
}
