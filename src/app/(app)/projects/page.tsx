'use client';

import { useState, useMemo } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { PixelBadge } from '@/components/ui/pixel-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreHorizontal, Search, X } from 'lucide-react';
import Link from 'next/link';
import type { UserRole } from '@/db/schema';

interface Project {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

export default function ProjectsPage() {
  const { user } = useShell();
  const userRole = (user.role ?? 'viewer') as UserRole;

  const { data: projects, isLoading } = usePolling<Project[]>({
    url: '/api/v1/projects',
    interval: 10000,
  });

  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({
      shallow: true,
      history: 'replace',
      throttleMs: 300,
    })
  );

  const allProjects = useMemo(() => projects ?? [], [projects]);

  const filteredProjects = useMemo(() => {
    if (!search) return allProjects;
    const term = search.toLowerCase();
    return allProjects.filter(
      (p) => p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term)
    );
  }, [allProjects, search]);

  return (
    <TooltipProvider>
      <div className="-mx-6 -mt-6 flex min-h-full flex-col">
        <PageHeader
          category="Projects"
          title="All Projects"
          action={<CreateProjectDialog userRole={userRole} />}
        />

        {/* Toolbar */}
        <div className="border-border-default flex items-center border-b px-6 py-3">
          <div className="relative w-full md:w-64">
            <Search className="text-text-muted absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
            <Input
              placeholder="SEARCH PROJECTS..."
              className="bg-bg-elevated focus:ring-accent-violet/30 h-8 pl-8 font-mono text-[10px] tracking-widest uppercase transition-all focus:ring-1"
              value={search}
              onChange={(e) => setSearch(e.target.value || null)}
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearch(null)}
                className="text-text-muted hover:text-text-primary absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="bg-border-default/50 mx-1 h-4 w-px" />

          <div className="flex items-center gap-2">
            <span className="text-text-muted font-mono text-[10px] tracking-widest uppercase opacity-50">
              Total: {allProjects.length}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {isLoading && allProjects.length === 0 ? (
            <div className="text-muted-foreground py-16 text-center font-mono text-xs">
              Loading projects…
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <DaemonMascot size={48} expression="idle" />
              <p className="text-text-secondary font-mono text-sm">
                {search ? 'No projects matching search.' : 'No projects yet.'}
              </p>
              {!search && (
                <CreateProjectDialog userRole={userRole} triggerLabel="Create your first project" />
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border-default text-text-secondary font-mono text-xs tracking-[0.15em] uppercase hover:bg-transparent">
                  <TableHead className="h-auto w-36 px-6 py-2.5 font-medium">ID</TableHead>
                  <TableHead className="h-auto px-3 py-2.5 font-medium">Name</TableHead>
                  <TableHead className="h-auto px-3 py-2.5 font-medium">Description</TableHead>
                  <TableHead className="h-auto w-32 px-3 py-2.5 font-medium">Created</TableHead>
                  <TableHead className="h-auto w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="border-border-default/50 hover:bg-bg-elevated/50"
                  >
                    <TableCell className="px-6 py-3">
                      <PixelBadge variant="amber">
                        PROJ-{String(project.id).padStart(3, '0')}
                      </PixelBadge>
                    </TableCell>
                    <TableCell className="text-text-primary px-3 py-3 text-sm font-medium">
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
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
                          </TooltipTrigger>
                          <TooltipContent>Project settings</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
