'use client';

import { useState } from 'react';
import { ProjectCard, DashboardEmptyState } from '@/components/project-card';
import { Button } from '@/components/ui/button';

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
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[13px] font-semibold text-text-primary">Projects</h2>
            </div>

            <div className="relative mb-4">
                <div className="absolute inset-y-0 left-[10px] flex items-center pointer-events-none">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </div>
                <input
                    type="search"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-[30px] bg-bg-elevated border border-border-default rounded-[6px] pl-8 pr-[10px] text-[12px] text-text-primary placeholder-text-text-tertiary outline-none focus:border-border-strong transition-colors"
                />
            </div>

            <div className="flex flex-col border border-border-subtle rounded-[6px] overflow-hidden">
                {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
                {filteredProjects.length === 0 && searchQuery && (
                    <div className="py-8 text-center text-[12px] text-text-secondary">
                        No projects found matching "{searchQuery}"
                    </div>
                )}
            </div>
        </>
    );
}
