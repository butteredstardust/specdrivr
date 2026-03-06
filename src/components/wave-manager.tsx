'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface WaveTask {
    id: number;
    description: string;
    priority: number;
    status: string;
    verify_command: string | null;
    done_criteria: string | null;
    resume_context: object | null;
    files_involved: string[];
}

interface WaveData {
    wave_id: string;
    wave_complete: boolean;
    tasks: WaveTask[];
    git_config: {
        repoUrl: string | null;
        branch: string;
        strategy: string | null;
        webhookUrl: string | null;
    };
}

interface WaveManagerProps {
    projectId: number;
}

export function WaveManager({ projectId }: WaveManagerProps) {
    const [waveData, setWaveData] = useState<WaveData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWave = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/agent/wave?project_id=${projectId}`);
            if (!response.ok) {
                const errorData = await response.json().catch((err) => { console.error('Failed to parse error response:', err); return {}; });
                throw new Error(errorData.error?.message || 'Failed to load wave data');
            }
            const data = await response.json();
            setWaveData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchWave();
    }, [fetchWave]);

    if (isLoading) {
        return (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[var(--sp-12)] text-center text-[var(--text-secondary)]">
                <div className="inline-flex items-center gap-[var(--sp-3)] text-[var(--font-size-sm)]">
                    <div className="w-[20px] h-[20px] rounded-full border-2 border-[var(--border-default)] border-t-[var(--brand-primary)] animate-spin" />
                    Loading wave data...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[var(--sp-6)] border-l-4 border-l-[var(--status-blocked-text)]">
                <p className="text-[var(--font-size-sm)] text-[var(--status-blocked-text)]">{error}</p>
                <Button onClick={fetchWave} variant="secondary" size="small" className="mt-[var(--sp-3)]">
                    Retry
                </Button>
            </div>
        );
    }

    if (!waveData || waveData.tasks.length === 0) {
        return (
            <div className="bg-[var(--bg-surface)] border-2 border-dashed border-[var(--border-default)] rounded-[var(--radius-lg)] p-[var(--sp-12)] text-center text-[var(--text-secondary)]">
                <h3 className="text-[var(--font-size-md)] font-semibold text-[var(--text-primary)] mb-[var(--sp-2)]">No active wave</h3>
                <p className="text-[var(--font-size-sm)] mb-[var(--sp-4)]">
                    All tasks are blocked by dependencies or the plan is fully complete.
                </p>
                <Button onClick={fetchWave} variant="secondary" size="small">
                    Refresh
                </Button>
            </div>
        );
    }

    const statusColor = (status: string) => {
        switch (status) {
            case 'in_progress': return 'bg-[var(--status-inprogress-bg)] text-[var(--status-inprogress-text)]';
            case 'done':
            case 'skipped': return 'bg-[var(--status-done-bg)] text-[var(--status-done-text)]';
            case 'blocked': return 'bg-[var(--status-paused-bg)] text-[var(--status-paused-text)]';
            default: return 'bg-[var(--status-todo-bg)] text-[var(--status-todo-text)]';
        }
    };

    return (
        <div className="space-y-[var(--sp-6)]">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[var(--font-size-lg)] font-semibold text-[var(--text-primary)]">Current Wave</h2>
                    <p className="text-[var(--font-size-sm)] text-[var(--text-secondary)] font-mono mt-[var(--sp-1)]">
                        {waveData.wave_id}
                    </p>
                </div>
                <div>
                    {waveData.wave_complete ? (
                        <span className="inline-flex items-center px-[var(--sp-3)] py-[var(--sp-1)] rounded-full bg-[var(--status-done-bg)] text-[var(--status-done-text)] border border-[var(--status-done-text)] text-[var(--font-size-sm)] font-medium">
                            Wave Complete
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-[var(--sp-3)] py-[var(--sp-1)] rounded-full bg-[var(--status-inprogress-bg)] text-[var(--status-inprogress-text)] border border-[var(--status-inprogress-text)] text-[var(--font-size-sm)] font-medium">
                            Executing
                        </span>
                    )}
                </div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[var(--sp-4)]">
                <h3 className="text-[var(--font-size-sm)] text-[var(--text-primary)] font-semibold mb-[var(--sp-3)]">Git Configuration</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-[var(--sp-4)]">
                    <div>
                        <p className="text-[var(--font-size-xs)] text-[var(--text-secondary)] uppercase mb-[var(--sp-1)] font-bold">Repo URL</p>
                        <p className="text-[var(--font-size-sm)] font-mono truncate">{waveData.git_config.repoUrl || 'None'}</p>
                    </div>
                    <div>
                        <p className="text-[var(--font-size-xs)] text-[var(--text-secondary)] uppercase mb-[var(--sp-1)] font-bold">Branch</p>
                        <p className="text-[var(--font-size-sm)]">{waveData.git_config.branch}</p>
                    </div>
                    <div>
                        <p className="text-[var(--font-size-xs)] text-[var(--text-secondary)] uppercase mb-[var(--sp-1)] font-bold">Strategy</p>
                        <p className="text-[var(--font-size-sm)] capitalize">{waveData.git_config.strategy || 'None'}</p>
                    </div>
                    <div>
                        <p className="text-[var(--font-size-xs)] text-[var(--text-secondary)] uppercase mb-[var(--sp-1)] font-bold">Webhook</p>
                        <p className="text-[10px] font-mono break-all text-[var(--brand-primary)]">{waveData.git_config.webhookUrl}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-[var(--sp-4)]">
                <div className="flex items-center justify-between">
                    <h3 className="text-[var(--font-size-sm)] text-[var(--text-primary)] font-semibold">Parallel Tasks ({waveData.tasks.length})</h3>
                    <Button onClick={fetchWave} variant="secondary" size="small">
                        Refresh
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--sp-4)]">
                    {waveData.tasks.map(task => (
                        <div key={task.id} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[var(--sp-4)] hover:border-[var(--border-focus)] transition-colors">
                            <div className="flex items-start justify-between mb-[var(--sp-2)]">
                                <span className="text-[var(--font-size-xs)] font-mono text-[var(--text-secondary)]">Task #{task.id}</span>
                                <span className={`inline-flex items-center px-[var(--sp-2)] py-[2px] rounded-[var(--radius-sm)] text-[var(--font-size-xs)] font-bold capitalize ${statusColor(task.status)}`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="text-[var(--font-size-sm)] font-medium text-[var(--text-primary)] mb-[var(--sp-3)]">
                                {task.description}
                            </p>

                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex gap-[var(--sp-2)] text-[var(--font-size-xs)] font-medium text-[var(--text-secondary)]">
                                    <span>Priority: {task.priority}</span>
                                    {task.files_involved?.length > 0 && (
                                        <span>• {task.files_involved.length} file(s)</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
