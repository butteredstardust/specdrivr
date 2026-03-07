'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ProjectSelect } from '@/db/schema';
import { Tabs, TabData } from '@/components/ui/tabs';

interface ProjectLayoutClientProps {
    children: ReactNode;
    projectId: number;
    project: ProjectSelect;
    testResultsCount: number;
    agentLogsCount: number;
}

export function ProjectLayoutClient({
    children,
    projectId,
    project,
    testResultsCount,
    agentLogsCount,
}: ProjectLayoutClientProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');

    const tabs: TabData[] = [
        { id: 'kanban', label: 'Kanban', href: `/projects/${projectId}` },
        { id: 'spec', label: 'Spec', href: `/projects/${projectId}?tab=spec` },
        { id: 'plan', label: 'Plan', href: `/projects/${projectId}?tab=plan` },
        { id: 'wave', label: 'Wave Execution', href: `/projects/${projectId}?tab=wave` },
        { id: 'commits', label: 'Commits', href: `/projects/${projectId}/commits` },
        { id: 'test-results', label: 'Test Results', href: `/projects/${projectId}?tab=test-results`, badge: testResultsCount > 0 ? testResultsCount : undefined },
        { id: 'logs', label: 'Logs', href: `/projects/${projectId}?tab=logs`, badge: agentLogsCount > 0 ? agentLogsCount : undefined },
        { id: 'settings', label: 'Settings', href: `/projects/${projectId}/settings` },
    ];

    let activeTabId = 'kanban';
    if (pathname.endsWith('/commits')) {
        activeTabId = 'commits';
    } else if (pathname.endsWith('/settings')) {
        activeTabId = 'settings';
    } else if (tabParam) {
        activeTabId = tabParam;
    }

    const tabTitles: Record<string, string> = {
        'kanban': 'Kanban Board',
        'spec': 'Specification',
        'plan': 'Plan',
        'wave': 'Wave Execution',
        'commits': 'Commits',
        'test-results': 'Test Results',
        'logs': 'Logs',
        'settings': 'Project Settings',
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-page)]">
            {/* Page Header */}
            <div className="px-[24px] pt-[24px] pb-0 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
                {/* Breadcrumb */}
                <div className="flex items-center gap-[8px] text-[13px] text-[var(--text-tertiary)] mb-[4px]">
                    <Link href="/" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] no-underline transition-colors">Projects</Link>
                    <span className="text-[var(--border-strong)]">/</span>
                    <span>{project.name}</span>
                </div>

                {/* Title */}
                <h1 className="text-[22px] font-bold text-[var(--text-primary)] m-0 mb-[16px] leading-[1.2]">
                    {tabTitles[activeTabId] || 'Project'}
                </h1>

                {/* Tabs */}
                <Tabs tabs={tabs} />
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
}
