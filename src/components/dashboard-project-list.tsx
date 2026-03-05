'use client';

import { useState } from 'react';
import { ProjectCard, DashboardEmptyState } from '@/components/project-card';
import { Button } from '@/components/ui/button';

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
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-[14px] font-bold text-white/40 uppercase tracking-[0.1em]">Projects</h2>
            </div>

            <div className="relative mb-8">
                <div className="absolute inset-y-0 left-[14px] flex items-center pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/20">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </div>
                <input
                    type="search"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-[40px] bg-white/[0.05] border border-white/5 rounded-2xl pl-10 pr-[14px] text-[13px] text-white placeholder-white/20 outline-none focus:border-accent/40 focus:bg-white/[0.08] transition-all duration-300"
                />
            </div>

            <GlassCard className="flex flex-col border-white/10 rounded-2xl overflow-hidden" intensity="low">
                {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
                {filteredProjects.length === 0 && searchQuery && (
                    <div className="py-12 text-center text-[14px] text-white/30 font-medium">
                        No projects found matching "{searchQuery}"
                    </div>
                )}
            </GlassCard>
        </>
    );
}
