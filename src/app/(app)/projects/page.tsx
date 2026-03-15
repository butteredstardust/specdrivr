import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { projectRepository } from '@/repositories/project-repository';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import type { UserRole } from '@/db/schema';

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const projects = await projectRepository.getByUserId(session.user.id);
  const userRole = (session.user.role ?? 'viewer') as UserRole;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-text-muted font-mono text-xs tracking-widest uppercase">PROJECTS</h1>
        <CreateProjectDialog userRole={userRole} />
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <DaemonMascot size={48} expression="idle" />
          <p className="text-text-secondary font-mono text-sm">No projects yet.</p>
          <CreateProjectDialog userRole={userRole} triggerLabel="Create your first project" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-mono text-sm">{project.name}</TableCell>
                <TableCell className="text-text-secondary text-sm">
                  {project.description ?? '—'}
                </TableCell>
                <TableCell className="text-text-secondary text-sm">
                  {new Date(project.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link
                      href={`/specs?projectId=${project.id}`}
                      className="text-accent-violet text-xs hover:underline"
                    >
                      View Specs
                    </Link>
                    <Link
                      href={`/settings?projectId=${project.id}`}
                      className="text-text-secondary text-xs hover:underline"
                    >
                      Settings
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
