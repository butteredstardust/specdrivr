'use client';

import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HealthData {
  status: 'ok' | 'degraded';
  db: boolean;
  redis: boolean;
  git: boolean;
  agentLastSeen: string | null;
}

type DotColor = 'emerald' | 'amber' | 'red' | 'muted';

function getAgtStatus(agentLastSeen: string | null): { color: DotColor; label: string } {
  if (!agentLastSeen) return { color: 'red', label: 'Agent: no recent activity' };
  const minsAgo = (Date.now() - new Date(agentLastSeen).getTime()) / 60000;
  if (minsAgo < 5)
    return { color: 'emerald', label: `Agent: last seen ${Math.floor(minsAgo)}m ago` };
  if (minsAgo < 15)
    return { color: 'amber', label: `Agent: last seen ${Math.floor(minsAgo)}m ago` };
  return { color: 'red', label: `Agent: last seen ${Math.floor(minsAgo)}m ago` };
}

const DOT_CLASS: Record<DotColor, string> = {
  emerald: 'bg-status-emerald',
  amber: 'bg-phosphor-amber',
  red: 'bg-status-red',
  muted: 'bg-text-muted',
};

interface IndicatorProps {
  label: string;
  color: DotColor;
  tooltip: string;
  collapsed?: boolean;
}

function Indicator({ label, color, tooltip, collapsed }: IndicatorProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center gap-0.5">
          {!collapsed && (
            <span className="text-text-muted font-mono text-[9px] leading-none">{label}</span>
          )}
          <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[color]}`} />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export function SystemsBar({ collapsed }: { collapsed?: boolean }) {
  const { activeProjectId } = useShell();

  const url = activeProjectId ? `/api/v1/health?projectId=${activeProjectId}` : '/api/v1/health';

  const { data: health } = usePolling<HealthData>({
    url,
    interval: 30000,
  });

  const agtStatus = getAgtStatus(health?.agentLastSeen ?? null);

  const gitColor: DotColor = !health ? 'muted' : health.git ? 'emerald' : 'amber';
  const gitTooltip = !health
    ? 'GitHub: unknown'
    : health.git
      ? 'GitHub: connected'
      : 'GitHub: not configured';

  const apiColor: DotColor = !health ? 'muted' : health.status === 'ok' ? 'emerald' : 'red';
  const apiTooltip = !health
    ? 'API: unknown'
    : health.status === 'ok'
      ? 'API: healthy'
      : 'API: degraded';

  const pgColor: DotColor = !health ? 'muted' : health.db ? 'emerald' : 'red';
  const pgTooltip = !health
    ? 'Database: unknown'
    : health.db
      ? 'Database: connected'
      : 'Database: unreachable';

  return (
    <TooltipProvider>
      <div className="flex items-center justify-around px-4 py-2">
        <Indicator label="GIT" color={gitColor} tooltip={gitTooltip} collapsed={collapsed} />
        <Indicator label="API" color={apiColor} tooltip={apiTooltip} collapsed={collapsed} />
        <Indicator
          label="AGT"
          color={agtStatus.color}
          tooltip={agtStatus.label}
          collapsed={collapsed}
        />
        <Indicator label="PG" color={pgColor} tooltip={pgTooltip} collapsed={collapsed} />
      </div>
    </TooltipProvider>
  );
}
