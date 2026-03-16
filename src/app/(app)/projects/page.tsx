import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { projectRepository } from '@/repositories/project-repository';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import type { UserRole } from '@/db/schema';

function ProjectIdBadge({ id }: { id: number }) {
  return (
    <code className="bg-phosphor-amber/10 text-phosphor-amber inline-flex items-center rounded px-1.5 py-0.5 font-mono text-xs">
      PROJ-{String(id).padStart(3, '0')}
    </code>
  );
}

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const projects = await projectRepository.getByUserId(session.user.id);
  const userRole = (session.user.role ?? 'viewer') as UserRole;

  return (
    <div className="-mx-6 -mt-6 flex min-h-full flex-col">
      {/* Header */}
      <div className="border-border-default flex items-center justify-between border-b px-6 py-4">
        <div>
          <div className="text-muted-foreground mb-1 font-mono text-[10px] tracking-[0.2em] uppercase">
            Projects
          </div>
          <h1 className="text-foreground text-xl font-semibold">All Projects</h1>
        </div>
        <CreateProjectDialog userRole={userRole} />
      </div>

      {/* Content */}
      <div className="border-border-default border-b px-6 py-2.5">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <DaemonMascot size={48} expression="idle" />
            <p className="text-muted-foreground font-mono text-sm">No projects yet.</p>
            <CreateProjectDialog userRole={userRole} triggerLabel="Create your first project" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border-default hover:bg-transparent">
                <TableHead className="text-muted-foreground h-auto w-36 px-6 py-2.5 font-mono text-[10px] font-medium tracking-[0.15em] uppercase">
                  ID
                </TableHead>
                <TableHead className="text-muted-foreground h-auto px-3 py-2.5 font-mono text-[10px] font-medium tracking-[0.15em] uppercase">
                  Name
                </TableHead>
                <TableHead className="text-muted-foreground h-auto px-3 py-2.5 font-mono text-[10px] font-medium tracking-[0.15em] uppercase">
                  Description
                </TableHead>
                <TableHead className="text-muted-foreground h-auto w-32 px-3 py-2.5 font-mono text-[10px] font-medium tracking-[0.15em] uppercase">
                  Created
                </TableHead>
                <TableHead className="h-auto w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow
                  key={project.id}
                  className="border-border-default/50 hover:bg-bg-elevated/50"
                >
                  <TableCell className="px-6 py-3">
                    <ProjectIdBadge id={project.id} />
                  </TableCell>
                  <TableCell className="text-foreground px-3 py-3 text-sm font-medium">
                    <Link href={`/specs?projectId=${project.id}`} className="hover:underline">
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground px-3 py-3 text-sm">
                    {project.description ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground px-3 py-3 font-mono text-[10px]">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground h-6 w-6"
                      asChild
                    >
                      <Link href={`/settings?projectId=${project.id}`}>
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
