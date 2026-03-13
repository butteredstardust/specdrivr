'use client';

import { useMemo, useState } from 'react';
import {
  PixelCard,
  PixelBadge,
  PixelTable,
  PixelProgress,
  PixelSkeleton,
  PixelDivider,
} from '@pxlkit/ui-kit';
import {
  CheckCircledIcon,
  DashboardIcon,
  InfoCircledIcon,
  ClockIcon,
  LockOpen1Icon,
  UpdateIcon,
  PersonIcon,
  QuestionMarkCircledIcon,
  TargetIcon,
  PlusIcon,
  GitHubLogoIcon,
} from '@radix-ui/react-icons';

interface SystemStatus {
  db: 'ok' | 'error';
  redis: 'ok' | 'error';
  overall: 'ok' | 'error';
}

interface SystemCounts {
  users: number;
  sessions: number;
  accounts: number;
  projects: number;
  specifications: number;
  plans: number;
  tasks: number;
  agentSessions: number;
  agentConfig: number;
}

interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  timestamp: Date;
}

// Initial state (will be replaced with real data if API succeeds)
const initialStatus: SystemStatus = {
  db: 'ok',
  redis: 'ok',
  overall: 'ok',
};

const initialCounts: SystemCounts = {
  users: 3,
  sessions: 2,
  accounts: 3,
  projects: 5,
  specifications: 8,
  plans: 3,
  tasks: 12,
  agentSessions: 7,
  agentConfig: 1,
};

const initialAuditLogs: AuditLogEntry[] = [
  { id: '1', userId: 'abc123', action: 'project_created', resourceType: 'projects', resourceId: 'def456', timestamp: new Date() },
  { id: '2', userId: 'abc123', action: 'spec_created', resourceType: 'specifications', resourceId: 'ghi789', timestamp: new Date(Date.now() - 300000) },
];

function StatusBadge({ status, label }: { status: 'ok' | 'error'; label: string }) {
  const Icon = status === 'ok' ? CheckCircledIcon : QuestionMarkCircledIcon;
  return (
    <PixelBadge tone={status === 'ok' ? 'green' : 'red'}>
      <span className="flex items-center gap-1.5">
        <Icon className="h-3 w-3" />
        {label}
      </span>
    </PixelBadge>
  );
}

function StatusCard({
  label,
  status,
  icon: Icon,
}: {
  label: string;
  status: 'ok' | 'error';
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="font-medium">{label}</span>
      </div>
      <StatusBadge status={status} label={status === 'ok' ? 'OK' : 'ERROR'} />
    </div>
  );
}

function EnvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-3 rounded bg-muted border">
      <span className="text-sm text-muted-foreground">{label}</span>
      <code className="px-2 py-1 rounded bg-background text-sm font-mono">{value}</code>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-colors group"
    >
      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold mb-1">{label}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRightIcon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
    </a>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <PixelSkeleton height="1rem" width="250px" />
      <PixelSkeleton height="1rem" width="200px" />
      <PixelSkeleton height="1rem" width="150px" />
    </div>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/>
      <path d="m12 5 7 7-7 7"/>
    </svg>
  );
}

export default function DebugDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<SystemStatus>(initialStatus);
  const [counts] = useState<SystemCounts>(initialCounts);
  const [auditLogs] = useState<AuditLogEntry[]>(initialAuditLogs);

  // Simulate loading (in real app, this would be the API fetch)
  useMemo(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Poll for status updates (in real app, this would fetch from API)
  useMemo(() => {
    const interval = setInterval(() => {
      setStatus(prev => ({ ...prev }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const overallHealth = status.db === 'ok' && status.redis === 'ok';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <TargetIcon className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Specdrivr Debug</h1>
                <PixelBadge tone="neutral">v0.1.0</PixelBadge>
              </div>
              <p className="text-muted-foreground mt-2 ml-11">
                AI Agent-Friendly System Status & Diagnostics
              </p>
            </div>
            <PixelBadge tone={overallHealth ? 'green' : 'red'}>
              <span className="flex items-center gap-2">
                {overallHealth ? <CheckCircledIcon /> : <QuestionMarkCircledIcon />}
                {overallHealth ? 'System Healthy' : 'System Issues'}
              </span>
            </PixelBadge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* System Status */}
        <PixelCard title="System Status" footer={<span className="text-xs text-muted-foreground">Core infrastructure health checks</span>}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusCard
              label="Overall Status"
              status={status.overall}
              icon={overallHealth ? CheckCircledIcon : QuestionMarkCircledIcon}
            />
            <StatusCard label="Database" status={status.db} icon={DashboardIcon} />
            <StatusCard label="Redis" status={status.redis} icon={ClockIcon} />
          </div>
          <PixelDivider spacing="md" />
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">System Health</span>
              <span className="font-medium">{overallHealth ? 'All systems operational' : 'Some services affected'}</span>
            </div>
            <PixelProgress value={overallHealth ? 100 : 50} tone={overallHealth ? 'green' : 'gold'} />
          </div>
        </PixelCard>

        {/* Environment Configuration */}
        <PixelCard title="Environment Configuration">
          <div className="space-y-3">
            <EnvRow label="NODE_ENV" value="development" />
            <EnvRow label="NEXTAUTH_URL" value="http://localhost:3000" />
            <EnvRow label="Session Expiry" value="7 days" />
            <EnvRow label="Timezone" value="UTC" />
          </div>
        </PixelCard>

        {/* Database Record Counts */}
        <PixelCard title="Database Record Counts">
          {isLoading ? (
            <LoadingState />
          ) : (
            <PixelTable
              columns={[
                { key: 'icon', header: '' },
                { key: 'entity', header: 'Entity' },
                { key: 'count', header: 'Count', className: 'text-right' }
              ]}
              data={[
                { id: 'users', icon: <PersonIcon className="h-4 w-4" />, entity: 'Users', count: <span className="font-mono">{counts.users}</span> },
                { id: 'sessions', icon: <ClockIcon className="h-4 w-4" />, entity: 'Sessions', count: <span className="font-mono">{counts.sessions}</span> },
                { id: 'projects', icon: <QuestionMarkCircledIcon className="h-4 w-4" />, entity: 'Projects', count: <span className="font-mono">{counts.projects}</span> },
                { id: 'specifications', icon: <InfoCircledIcon className="h-4 w-4" />, entity: 'Specifications', count: <span className="font-mono">{counts.specifications}</span> },
                { id: 'plans', icon: <TargetIcon className="h-4 w-4" />, entity: 'Plans', count: <span className="font-mono">{counts.plans}</span> },
                { id: 'tasks', icon: <PlusIcon className="h-4 w-4" />, entity: 'Tasks', count: <span className="font-mono">{counts.tasks}</span> },
                { id: 'agentSessions', icon: <UpdateIcon className="h-4 w-4" />, entity: 'Agent Sessions', count: <span className="font-mono">{counts.agentSessions}</span> },
              ]}
            />
          )}
        </PixelCard>

        {/* Recent Activity */}
        <PixelCard title="Recent Activity">
          {isLoading ? (
            <LoadingState />
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TargetIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircledIcon className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{log.action}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {log.timestamp.toLocaleString()}
                    </span>
                  </div>
                  {(log.resourceType || log.resourceId) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {log.resourceType && (
                        <PixelBadge tone="neutral">{log.resourceType}</PixelBadge>
                      )}
                      {log.resourceId && (
                        <code className="text-xs bg-muted px-1 rounded">
                          #{log.resourceId.slice(0, 8)}...
                        </code>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </PixelCard>

        {/* Quick Actions */}
        <PixelCard title="Quick Actions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickAction
              href="/login"
              icon={LockOpen1Icon}
              label="Login / Sign Up"
              description="Access authentication flow"
            />
            <QuickAction
              href="/dashboard"
              icon={DashboardIcon}
              label="Dashboard"
              description="Main application interface"
            />
            <QuickAction
              href="/api/health"
              icon={CheckCircledIcon}
              label="Health API"
              description="JSON health check endpoint"
            />
            <QuickAction
              href="https://github.com/butteredstardust/specdrivr"
              icon={GitHubLogoIcon}
              label="Documentation"
              description="Project repository and docs"
            />
          </div>
          <PixelDivider spacing="md" />
          <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <UpdateIcon className="h-3 w-3" />
              <span>Debug Dashboard | Specdrivr v0.1.0</span>
            </div>
            <span>No authentication required</span>
          </div>
        </PixelCard>
      </div>
    </div>
  );
}
