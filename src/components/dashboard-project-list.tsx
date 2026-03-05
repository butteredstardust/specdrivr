'use client';

import { useState } from 'react';
import { ProjectCard, DashboardEmptyState } from '@/components/project-card';

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
                <h2 className="text-base font-semibold text-gray-800">Projects</h2>
            </div>

            <div className="relative mb-4">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </div>
                <input
                    type="search"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
                {filteredProjects.length === 0 && searchQuery && (
                    <div className="col-span-full py-8 text-center text-sm text-gray-500">
                        No projects found matching "{searchQuery}"
                    </div>
                )}
            </div>
        </>
    );
}
