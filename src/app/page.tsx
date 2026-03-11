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

// Simple inline SVG icons
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
);

const ErrorOctagonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);

const TargetHitIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7-7-7-7"/></svg>
);

const PulsingDotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="animate-pulse"><circle cx="12" cy="12" r="4"/></svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const UserGroupIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-3-3.87"/><path d="M9 21v-2a4 4 0 0 1 4-3.87"/><circle cx="12" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const CoinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
);

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-500"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);

const ChestIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22v-8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8"/><path d="M2 8l7.6 3.2a2 2 0 0 0 1.6 0L20 8"/><path d="M2 10V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"/><rect x="10" y="6" width="4" height="6"/></svg>
);

const LoadingSpinnerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

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

// Mock data
const mockStatus: SystemStatus = {
  db: 'ok',
  redis: 'ok',
  overall: 'ok',
};

const mockCounts: SystemCounts = {
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

const mockAuditLogs: AuditLogEntry[] = [
  { id: '1', userId: 'abc123', action: 'user_created', resourceType: 'users', resourceId: 'abc123', timestamp: new Date() },
  { id: '2', userId: 'abc123', action: 'project_created', resourceType: 'projects', resourceId: 'def456', timestamp: new Date(Date.now() - 300000) },
];

function StatusBadge({ status, label }: { status: 'ok' | 'error'; label: string }) {
  return (
    <Badge variant={status === 'ok' ? 'default' : 'destructive'}>
      <span className="flex items-center gap-1.5">
        {status === 'ok' ? <CheckCircleIcon /> : <ErrorOctagonIcon />}
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
        <Icon />
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
        <Icon />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold mb-1">{label}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRightIcon className="mt-1 text-muted-foreground group-hover:text-foreground transition-colors" />
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

export default function DebugDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<SystemStatus>(mockStatus);

  useMemo(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

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
                <TargetHitIcon className="text-primary" />
                <h1 className="text-3xl font-bold">Specdrivr Debug</h1>
              </div>
              <p className="text-muted-foreground mt-2 ml-11">
                AI Agent-Friendly System Status & Diagnostics
              </p>
            </div>
            <div className="flex items-center gap-4">
              <PulsingDotIcon />
              <Badge variant={overallHealth ? 'default' : 'destructive'} className="gap-2">
                {overallHealth ? <CheckCircleIcon /> : <ErrorOctagonIcon />}
                {overallHealth ? 'System Healthy' : 'System Issues'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PulsingDotIcon />
              System Status
            </CardTitle>
            <CardDescription>Core infrastructure health checks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatusCard
                label="Overall Status"
                status={status.overall}
                icon={overallHealth ? CheckCircleIcon : ErrorOctagonIcon}
              />
              <StatusCard label="Database" status={status.db} icon={ClockIcon} />
              <StatusCard label="Redis" status={status.redis} icon={BellIcon} />
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
              <SettingsIcon />
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
              <ChestIcon />
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
                    <TableCell><UserIcon className="h-4 w-4" /></TableCell>
                    <TableCell>Users</TableCell>
                    <TableCell className="text-right font-mono">{mockCounts.users}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><ClockIcon /></TableCell>
                    <TableCell>Sessions</TableCell>
                    <TableCell className="text-right font-mono">{mockCounts.sessions}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><CoinIcon /></TableCell>
                    <TableCell>Projects</TableCell>
                    <TableCell className="text-right font-mono">{mockCounts.projects}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><StarIcon /></TableCell>
                    <TableCell>Specifications</TableCell>
                    <TableCell className="text-right font-mono">{mockCounts.specifications}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><UserGroupIcon /></TableCell>
                    <TableCell>Plans</TableCell>
                    <TableCell className="text-right font-mono">{mockCounts.plans}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><TargetHitIcon className="h-4 w-4" /></TableCell>
                    <TableCell>Tasks</TableCell>
                    <TableCell className="text-right font-mono">{mockCounts.tasks}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><BellIcon /></TableCell>
                    <TableCell>Agent Sessions</TableCell>
                    <TableCell className="text-right font-mono">{mockCounts.agentSessions}</TableCell>
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
              <TargetHitIcon />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest audit log entries</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState />
            ) : mockAuditLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TargetHitIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mockAuditLogs.map((log) => (
                  <div key={log.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
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
              <ArrowRightIcon />
              Quick Actions
            </CardTitle>
            <CardDescription>Common debugging and navigation links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuickAction
                href="/login"
                icon={UserIcon}
                label="Login / Sign Up"
                description="Access authentication flow"
              />
              <QuickAction
                href="/dashboard"
                icon={HomeIcon}
                label="Dashboard"
                description="Main application interface"
              />
              <QuickAction
                href="/api/health"
                icon={CheckCircleIcon}
                label="Health API"
                description="JSON health check endpoint"
              />
              <QuickAction
                href="https://github.com/butteredstardust/specdrivr"
                icon={SettingsIcon}
                label="Documentation"
                description="Project repository and docs"
              />
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <LoadingSpinnerIcon />
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
