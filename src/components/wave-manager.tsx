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
            <div className="ios-card p-12 text-center text-ios-text-secondary">
                <div className="inline-flex items-center gap-3 ios-body">
                    <div className="w-5 h-5 rounded-full border-2 border-ios-gray-400 border-t-ios-blue animate-spin" />
                    Loading wave data...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="ios-card p-6 border-l-4 border-ios-red">
                <p className="ios-body text-ios-red">{error}</p>
                <Button onClick={fetchWave} variant="secondary" size="small" className="mt-3">
                    Retry
                </Button>
            </div>
        );
    }

    if (!waveData || waveData.tasks.length === 0) {
        return (
            <div className="ios-card p-12 text-center text-ios-text-secondary border border-dashed border-ios-border">
                <h3 className="ios-title-3 text-ios-text-primary mb-2">No active wave</h3>
                <p className="ios-body mb-4">
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
                    <h2 className="ios-title-2 text-ios-text-primary">Current Wave</h2>
                    <p className="ios-caption text-ios-text-secondary font-mono mt-1">
                        {waveData.wave_id}
                    </p>
                </div>
                <div>
                    {waveData.wave_complete ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-ios-green/10 text-ios-green border border-ios-green/20 text-sm font-medium">
                            Wave Complete
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-ios-blue/10 text-ios-blue border border-ios-blue/20 text-sm font-medium">
                            Executing
                        </span>
                    )}
                </div>
            </div>

            <div className="ios-card border border-ios-border p-4">
                <h3 className="ios-subheadline text-ios-text-primary mb-3">Git Configuration</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="ios-caption-1 text-ios-text-secondary uppercase mb-1">Repo URL</p>
                        <p className="ios-body font-mono text-sm truncate">{waveData.git_config.repoUrl || 'None'}</p>
                    </div>
                    <div>
                        <p className="ios-caption-1 text-ios-text-secondary uppercase mb-1">Branch</p>
                        <p className="ios-body text-sm">{waveData.git_config.branch}</p>
                    </div>
                    <div>
                        <p className="ios-caption-1 text-ios-text-secondary uppercase mb-1">Strategy</p>
                        <p className="ios-body text-sm capitalize">{waveData.git_config.strategy || 'None'}</p>
                    </div>
                    <div>
                        <p className="ios-caption-1 text-ios-text-secondary uppercase mb-1">Webhook</p>
                        <p className="ios-body font-mono text-[10px] break-all text-ios-blue">{waveData.git_config.webhookUrl}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="ios-subheadline text-ios-text-primary">Parallel Tasks ({waveData.tasks.length})</h3>
                    <Button onClick={fetchWave} variant="secondary" size="small">
                        Refresh
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {waveData.tasks.map(task => (
                        <div key={task.id} className="ios-card border border-ios-border p-4 hover:border-ios-blue/30 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                                <span className="ios-caption font-mono text-ios-text-secondary">Task #{task.id}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium capitalize ${task.status === 'in_progress' ? 'bg-ios-blue/10 text-ios-blue' :
                                        task.status === 'done' || task.status === 'skipped' ? 'bg-ios-green/10 text-ios-green' :
                                            task.status === 'blocked' ? 'bg-ios-yellow/10 text-ios-yellow' :
                                                'bg-ios-gray-6 text-ios-text-secondary'
                                    }`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="ios-body font-medium text-ios-text-primary mb-3">
                                {task.description}
                            </p>

                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex gap-2 text-ios-caption-2 text-ios-text-secondary">
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
