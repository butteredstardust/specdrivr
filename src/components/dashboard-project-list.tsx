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
            <style>{`
                .dashboard-search-input {
                    background: #F1F2F4;
                    border: 2px solid transparent;
                    border-radius: 4px;
                    height: 32px;
                    padding: 0 12px 0 32px;
                    width: 100%;
                    color: #172B4D;
                    font-size: 14px;
                    outline: none;
                    transition: all 0.2s ease;
                }
                .dashboard-search-input::placeholder {
                    color: #8590A2;
                }
                .dashboard-search-input:focus {
                    background: #FFFFFF;
                    border-color: #0C66E4;
                    box-shadow: 0 0 0 1px #0C66E4;
                }
            `}</style>
            <div className="flex items-center justify-between" style={{ marginBottom: '8px', marginTop: 0 }}>
                <h2 style={{ fontSize: '11px', fontWeight: 600, color: '#8590A2', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Projects</h2>
            </div>

            <div className="relative mb-[var(--sp-6)]">
                <div className="absolute inset-y-0 flex items-center pointer-events-none" style={{ left: '10px' }}>
                    <Search size={14} color="#8590A2" />
                </div>
                <input
                    type="search"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="dashboard-search-input"
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
