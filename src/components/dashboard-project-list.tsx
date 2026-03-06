'use client';

import { useState } from 'react';
import { ProjectCard, DashboardEmptyState } from '@/components/project-card';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

import { GlassCard } from './ui/glass-card';

export function DashboardProjectList({ projects }: { projects: any[] }) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProjects = projects.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (projects.length === 0) {
        return <DashboardEmptyState />;
    }

    return (
        <>
            <div className="flex items-center justify-between mb-[var(--sp-6)]">
                <h2 className="text-[var(--font-size-xs)] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-[0.08em]">Projects</h2>
            </div>

            <div className="relative mb-[var(--sp-6)]">
                <div className="absolute inset-y-0 left-[10px] flex items-center pointer-events-none">
                    <Search size={14} className="text-[var(--color-text-tertiary)]" />
                </div>
                <input
                    type="search"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-[32px] bg-[var(--color-bg-sunken)] border-2 border-transparent rounded-[var(--radius-md)] pl-[32px] pr-[var(--sp-3)] text-[var(--font-size-base)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none hover:bg-[var(--color-bg-hovered)] focus:bg-[var(--color-bg-surface)] focus:border-[var(--color-border-selected)] focus:shadow-[0_0_0_1px_var(--color-border-selected)] transition-all"
                />
            </div>

            <GlassCard className="flex flex-col overflow-hidden" intensity="low">
                {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
                {filteredProjects.length === 0 && searchQuery && (
                    <div className="py-[var(--sp-12)] text-center text-[var(--font-size-base)] text-[var(--color-text-secondary)]">
                        No projects found matching &quot;{searchQuery}&quot;
                    </div>
                )}
            </GlassCard>
        </>
    );
}
