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
                const errorData = await response.json().catch(() => ({}));
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
            <div className="bg-bg-elevated border border-border-default rounded-[8px] p-12 text-center text-text-secondary">
                <div className="inline-flex items-center gap-3 text-[13px]">
                    <div className="w-5 h-5 rounded-full border-2 border-status-idle-400 border-t-accent animate-spin" />
                    Loading wave data...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-bg-elevated border border-border-default rounded-[8px] p-6 border-l-4 border-status-error">
                <p className="text-[13px] text-status-error">{error}</p>
                <Button onClick={fetchWave} variant="secondary" size="small" className="mt-3">
                    Retry
                </Button>
            </div>
        );
    }

    if (!waveData || waveData.tasks.length === 0) {
        return (
            <div className="bg-bg-elevated border border-border-default rounded-[8px] p-12 text-center text-text-secondary border border-dashed border-border-default">
                <h3 className="text-[16px] font-semibold text-text-primary mb-2">No active wave</h3>
                <p className="text-[13px] mb-4">
                    All tasks are blocked by dependencies or the plan is fully complete.
                </p>
                <Button onClick={fetchWave} variant="secondary" size="small">
                    Refresh
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[20px] font-semibold text-text-primary">Current Wave</h2>
                    <p className="ios-caption text-text-secondary font-mono mt-1">
                        {waveData.wave_id}
                    </p>
                </div>
                <div>
                    {waveData.wave_complete ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-status-success/10 text-status-success border border-status-success/20 text-sm font-medium">
                            Wave Complete
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-sm font-medium">
                            Executing
                        </span>
                    )}
                </div>
            </div>

            <div className="bg-bg-elevated border border-border-default rounded-[8px] border border-border-default p-4">
                <h3 className="text-[12px] text-text-primary mb-3">Git Configuration</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-[11px] text-text-secondary uppercase mb-1">Repo URL</p>
                        <p className="text-[13px] font-mono text-sm truncate">{waveData.git_config.repoUrl || 'None'}</p>
                    </div>
                    <div>
                        <p className="text-[11px] text-text-secondary uppercase mb-1">Branch</p>
                        <p className="text-[13px] text-sm">{waveData.git_config.branch}</p>
                    </div>
                    <div>
                        <p className="text-[11px] text-text-secondary uppercase mb-1">Strategy</p>
                        <p className="text-[13px] text-sm capitalize">{waveData.git_config.strategy || 'None'}</p>
                    </div>
                    <div>
                        <p className="text-[11px] text-text-secondary uppercase mb-1">Webhook</p>
                        <p className="text-[13px] font-mono text-[10px] break-all text-accent">{waveData.git_config.webhookUrl}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-[12px] text-text-primary">Parallel Tasks ({waveData.tasks.length})</h3>
                    <Button onClick={fetchWave} variant="secondary" size="small">
                        Refresh
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {waveData.tasks.map(task => (
                        <div key={task.id} className="bg-bg-elevated border border-border-default rounded-[8px] border border-border-default p-4 hover:border-accent/30 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                                <span className="ios-caption font-mono text-text-secondary">Task #{task.id}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize ${task.status === 'in_progress' ? 'bg-accent/10 text-accent' :
                                        task.status === 'done' || task.status === 'skipped' ? 'bg-status-success/10 text-status-success' :
                                            task.status === 'blocked' ? 'bg-ios-yellow/10 text-ios-yellow' :
                                                'bg-status-idle-6 text-text-secondary'
                                    }`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="text-[13px] font-medium text-text-primary mb-3">
                                {task.description}
                            </p>

                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex gap-2 text-text-[11px] font-medium text-text-secondary">
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
