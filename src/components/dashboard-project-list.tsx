'use client';

import { useState } from 'react';
import { ProjectCard, DashboardEmptyState, type ProjectCardProps } from '@/components/project-card';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

import { GlassCard } from './ui/glass-card';

export function DashboardProjectList({ projects }: { projects: ProjectCardProps['project'][] }) {
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
                    background: #FFFFFF;
                    border: 1px solid #DFE1E6;
                    border-radius: 6px;
                    height: 32px;
                    padding: 0 12px 0 32px;
                    margin-bottom: 8px;
                    width: 100%;
                    font-size: 13px;
                    color: #172B4D;
                    outline: none;
                    transition: all 0.2s ease;
                }
                .dashboard-search-input::placeholder {
                    color: #8590A2;
                }
                .dashboard-search-input:focus {
                    border-color: #2563EB;
                    box-shadow: 0 0 0 2px rgba(37,99,235,0.15);
                }
            `}</style>
            <div className="flex items-center justify-between" style={{ marginTop: '20px', marginBottom: '8px', paddingLeft: 0 }}>
                <h2 style={{ fontSize: '11px', fontWeight: 600, color: '#8590A2', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Projects</h2>
            </div>

            <div className="relative">
                <div className="absolute inset-y-0 flex items-center pointer-events-none" style={{ left: '10px', top: '-8px' }}>
                    <Search size={14} className="text-[var(--text-tertiary)]" />
                </div>
                <input
                    type="search"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="dashboard-search-input"
                />
            </div>

            <div
                className="flex flex-col"
                style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-card)'
                }}
            >
                {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
                {filteredProjects.length === 0 && searchQuery && (
                    <div className="py-[var(--sp-12)] text-center text-[var(--font-size-base)] text-[var(--text-secondary)]">
                        No projects found matching &quot;{searchQuery}&quot;
                    </div>
                )}
            </div>
        </>
    );
}
