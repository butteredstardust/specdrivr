import { AppShell } from '@/components/app-shell';
import { getProjects } from '@/lib/actions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const result = await getProjects();

    // If not authenticated, the middleware should have caught it, 
    // but we should still handle the data failure gracefully if needed.
    let projects: any[] = [];
    if (result.success && result.projects) {
        projects = result.projects;
    }

    return (
        <AppShell sidebarProjects={projects}>
            {children}
        </AppShell>
    );
}
