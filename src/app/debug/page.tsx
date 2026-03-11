'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
    <Badge variant={status === 'ok' ? 'default' : 'destructive'}>
      <span className="flex items-center gap-1.5">
        <Icon className="h-3 w-3" />
        {label}
      </span>
    </Badge>
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
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[150px]" />
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
                <Badge variant="outline" className="text-xs">v0.1.0</Badge>
              </div>
              <p className="text-muted-foreground mt-2 ml-11">
                AI Agent-Friendly System Status & Diagnostics
              </p>
            </div>
            <Badge variant={overallHealth ? 'default' : 'destructive'} className="gap-2">
              {overallHealth ? <CheckCircledIcon /> : <QuestionMarkCircledIcon />}
              {overallHealth ? 'System Healthy' : 'System Issues'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UpdateIcon className="h-5 w-5 text-primary" />
              System Status
            </CardTitle>
            <CardDescription>Core infrastructure health checks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatusCard
                label="Overall Status"
                status={status.overall}
                icon={overallHealth ? CheckCircledIcon : QuestionMarkCircledIcon}
              />
              <StatusCard label="Database" status={status.db} icon={DashboardIcon} />
              <StatusCard label="Redis" status={status.redis} icon={ClockIcon} />
            </div>
            <Separator className="my-6" />
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">System Health</span>
                <span className="font-medium">{overallHealth ? 'All systems operational' : 'Some services affected'}</span>
              </div>
              <Progress value={overallHealth ? 100 : 50} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Environment Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <InfoCircledIcon className="h-5 w-5 text-primary" />
              Environment Configuration
            </CardTitle>
            <CardDescription>Safe configuration values (no secrets)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <EnvRow label="NODE_ENV" value="development" />
              <EnvRow label="NEXTAUTH_URL" value="http://localhost:3000" />
              <EnvRow label="Session Expiry" value="7 days" />
              <EnvRow label="Timezone" value="UTC" />
            </div>
          </CardContent>
        </Card>

        {/* Database Record Counts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DashboardIcon className="h-5 w-5 text-primary" />
              Database Record Counts
            </CardTitle>
            <CardDescription>Overview of records in major tables</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead />
                    <TableHead>Entity</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell><PersonIcon className="h-4 w-4" /></TableCell>
                    <TableCell>Users</TableCell>
                    <TableCell className="text-right font-mono">{counts.users}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><ClockIcon className="h-4 w-4" /></TableCell>
                    <TableCell>Sessions</TableCell>
                    <TableCell className="text-right font-mono">{counts.sessions}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><QuestionMarkCircledIcon className="h-4 w-4" /></TableCell>
                    <TableCell>Projects</TableCell>
                    <TableCell className="text-right font-mono">{counts.projects}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><InfoCircledIcon className="h-4 w-4" /></TableCell>
                    <TableCell>Specifications</TableCell>
                    <TableCell className="text-right font-mono">{counts.specifications}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><TargetIcon className="h-4 w-4" /></TableCell>
                    <TableCell>Plans</TableCell>
                    <TableCell className="text-right font-mono">{counts.plans}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><PlusIcon className="h-4 w-4" /></TableCell>
                    <TableCell>Tasks</TableCell>
                    <TableCell className="text-right font-mono">{counts.tasks}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><UpdateIcon className="h-4 w-4" /></TableCell>
                    <TableCell>Agent Sessions</TableCell>
                    <TableCell className="text-right font-mono">{counts.agentSessions}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UpdateIcon className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest audit log entries</CardDescription>
          </CardHeader>
          <CardContent>
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
                          <Badge variant="outline" className="text-xs">{log.resourceType}</Badge>
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
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common debugging and navigation links</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
          <CardFooter>
            <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <UpdateIcon className="h-3 w-3" />
                <span>Debug Dashboard | Specdrivr v0.1.0</span>
              </div>
              <span>No authentication required</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
