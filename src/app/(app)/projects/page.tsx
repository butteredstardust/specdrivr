'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState, parseAsString } from 'nuqs';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { StatusIcon } from '@/components/ui/status-icon';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import {
  FilterToolbar,
  FilterToolbarActions,
  FilterToolbarMeta,
  FilterSearch,
  FilterClearButton,
} from '@/components/ui/filter-toolbar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreHorizontal } from 'lucide-react';
import type { UserRole } from '@/db/schema';

interface Project {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
}

export default function ProjectsPage() {
  const { user, setActiveProjectId } = useShell();
  const router = useRouter();
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

  const openProject = (projectId: number, path: '/specs' | '/settings') => {
    setActiveProjectId(projectId);
    router.push(path);
    router.refresh();
  };

  return (
    <TooltipProvider>
      <div className="animate-fade-in-up full-bleed fill-shell flex flex-col">
        <PageHeader
          category="Projects"
          title="All Projects"
          action={<CreateProjectDialog userRole={userRole} />}
        />

        <FilterToolbar>
          <FilterSearch
            value={search}
            onValueChange={(value) => setSearch(value || null)}
            placeholder="Search projects…"
            label="Search projects"
          />

          <FilterToolbarMeta>
            {filteredProjects.length === allProjects.length
              ? `${allProjects.length} ${allProjects.length === 1 ? 'project' : 'projects'}`
              : `${filteredProjects.length} of ${allProjects.length} projects`}
          </FilterToolbarMeta>

          {search !== '' && (
            <FilterToolbarActions>
              <FilterClearButton onClear={() => setSearch(null)} />
            </FilterToolbarActions>
          )}
        </FilterToolbar>

        {/* Content */}
        <div className="border-line flex-1 border">
          {isLoading && allProjects.length === 0 ? (
            <div className="text-fg-muted py-16 text-center text-xs">Loading projects…</div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <StatusIcon size={24} status="idle" />
              <p className="text-fg-secondary text-sm">
                {search ? 'No projects matching search.' : 'No projects yet.'}
              </p>
              {!search && (
                <CreateProjectDialog userRole={userRole} triggerLabel="Create your first project" />
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-line text-fg-secondary text-xs hover:bg-transparent">
                  <TableHead className="h-auto w-36 px-6 py-2.5 font-medium">ID</TableHead>
                  <TableHead className="h-auto px-3 py-2.5 font-medium">Name</TableHead>
                  <TableHead className="h-auto px-3 py-2.5 font-medium">Description</TableHead>
                  <TableHead className="h-auto w-32 px-3 py-2.5 font-medium">Created</TableHead>
                  <TableHead className="h-auto w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id} className="border-line-subtle hover:bg-surface-inset">
                    <TableCell className="px-6 py-3">
                      <Badge variant="warning">PROJ-{String(project.id).padStart(3, '0')}</Badge>
                    </TableCell>
                    <TableCell className="text-fg px-3 py-3 text-sm font-medium">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => openProject(project.id, '/specs')}
                        className="h-auto cursor-pointer p-0 text-inherit"
                      >
                        {project.name}
                      </Button>
                    </TableCell>
                    <TableCell className="text-fg-muted px-3 py-3 text-sm">
                      {project.description ?? '—'}
                    </TableCell>
                    <TableCell className="text-fg-muted text-2xs px-3 py-3 font-mono">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-fg-muted h-6 w-6"
                              onClick={() => openProject(project.id, '/settings')}
                              aria-label={`Open settings for ${project.name}`}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
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
