'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePolling } from '@/hooks/use-polling';
import {
  Monitor,
  FolderKanban,
  FileText,
  Terminal,
  Bell,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
} from 'lucide-react';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { PlayfulDaemon } from '@/components/ui/playful-daemon';
import { PlayfulLogo } from '@/components/ui/playful-logo';
import { useSystemHealth } from '@/components/layout/systems-bar';
import { useShell } from '@/components/shell/shell-context';
import { PixelBadge } from '@/components/ui/pixel-badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const COLLAPSED_KEY = 'sidebar-collapsed';

interface SidebarProps {
  projects: Array<{ id: number; name: string; slug: string }>;
}

const NAV_ITEMS = [
  { href: '/', label: 'Mission Control', icon: Monitor, exact: true },
  { href: '/projects', label: 'Projects', icon: FolderKanban, exact: false },
  { href: '/specs', label: 'Specs', icon: FileText, exact: false },
  { href: '/sessions', label: 'Sessions', icon: Terminal, exact: false },
  { href: '/notifications', label: 'Notifications', icon: Bell, exact: false },
  { href: '/settings', label: 'Settings', icon: Settings, exact: false },
];

type HealthState = 'ok' | 'warn' | 'error' | 'unknown';

type DaemonExpr = 'idle' | 'working' | 'success' | 'blocked' | 'error';

function healthToExpr(state: HealthState): DaemonExpr {
  switch (state) {
    case 'ok':
      return 'success';
    case 'warn':
      return 'blocked';
    case 'error':
      return 'error';
    default:
      return 'idle';
  }
}

function healthDot(state: HealthState) {
  switch (state) {
    case 'ok':
      return 'bg-status-emerald';
    case 'warn':
      return 'bg-phosphor-amber';
    case 'error':
      return 'bg-status-red';
    default:
      return 'bg-text-muted';
  }
}

function SystemIcon({
  label,
  state,
  tooltip,
}: {
  label: string;
  state: HealthState;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex cursor-default flex-col items-center gap-0.5">
          <div className="relative">
            <DaemonMascot size={32} expression={healthToExpr(state)} />
            <span
              className={cn(
                'border-bg-surface absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border',
                healthDot(state)
              )}
            />
          </div>
          <span className="text-text-muted mt-0.5 font-mono text-[8px] tracking-wider">
            {label}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarBottom({ collapsed }: { collapsed: boolean }) {
  const health = useSystemHealth();

  const overallExpr: DaemonExpr =
    health.overall === 'ok' ? 'idle' : health.overall === 'degraded' ? 'error' : 'idle';

  const statusText =
    health.overall === 'ok'
      ? 'SYSTEM OK'
      : health.overall === 'degraded'
        ? 'DEGRADED'
        : 'CONNECTING';

  const statusClass =
    health.overall === 'ok'
      ? 'text-text-muted'
      : health.overall === 'degraded'
        ? 'text-status-red'
        : 'text-text-muted';

  const gitTooltip =
    health.git === 'ok'
      ? 'GitHub: connected'
      : health.git === 'warn'
        ? 'GitHub: not configured'
        : 'GitHub: unknown';
  const apiTooltip =
    health.api === 'ok'
      ? 'API: healthy'
      : health.api === 'error'
        ? 'API: degraded'
        : 'API: unknown';
  const agtTooltip =
    health.agt === 'ok'
      ? 'Agent: active'
      : health.agt === 'warn'
        ? 'Agent: idle'
        : health.agt === 'error'
          ? 'Agent: offline'
          : 'Agent: unknown';
  const pgTooltip =
    health.pg === 'ok'
      ? 'Database: connected'
      : health.pg === 'error'
        ? 'Database: unreachable'
        : 'Database: unknown';

  if (collapsed) {
    return (
      <div className="border-border-default flex flex-col items-center gap-2 border-t py-3">
        <DaemonMascot size={20} expression={overallExpr} />
      </div>
    );
  }

  return (
    <div className="border-border-default border-t">
      {/* Systems icons */}
      <div className="px-3 pt-3 pb-1">
        <span className="text-text-muted mb-2 block px-1 font-mono text-[11px] tracking-[0.08em] uppercase">
          Systems
        </span>
        <div className="flex items-end justify-around">
          <SystemIcon label="GIT" state={health.git} tooltip={gitTooltip} />
          <SystemIcon label="API" state={health.api} tooltip={apiTooltip} />
          <SystemIcon label="AGT" state={health.agt} tooltip={agtTooltip} />
          <SystemIcon label="PG" state={health.pg} tooltip={pgTooltip} />
        </div>
      </div>

      {/* Daemon status footer */}
      <div className="px-3 pt-1 pb-3">
        <div className="flex items-center gap-1.5">
          <DaemonMascot size={20} expression={overallExpr} />
          <span className={cn('font-mono text-[11px] tracking-[0.08em] uppercase', statusClass)}>
            DAEMON · {statusText}
          </span>
        </div>
        <div className="mt-1 px-0.5">
          <span className="text-text-muted/50 font-mono text-[9px]">v0.1.0</span>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ projects }: SidebarProps) {
  const pathname = usePathname();

  const { activeProjectId, setActiveProjectId, devMode } = useShell();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { data: notifData } = usePolling<{ meta: { total: number } }>({
    url: '/api/v1/notifications?unread=true&limit=1',
    interval: 30_000,
  });
  const unreadCount = notifData?.meta?.total ?? 0;

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored === 'true') setCollapsed(true);
    setMounted(true);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSED_KEY, String(next));
  };

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  const isCollapsed = mounted && collapsed;

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0] ?? null;
  const projectPath = activeProject ? `~/${activeProject.slug}` : '~/select-project';

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          'border-border-default bg-bg-surface flex h-full flex-shrink-0 flex-col border-r transition-all duration-200',
          isCollapsed ? 'w-14' : 'w-56'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4">
          {isCollapsed ? (
            <div className="flex w-full justify-center">
              <PlayfulDaemon size={32} />
            </div>
          ) : (
            <>
              <PlayfulDaemon size={32} />
              <PlayfulLogo />
              {devMode && (
                <PixelBadge variant="amber" className="font-mono text-[10px]">
                  DEV
                </PixelBadge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-text-muted hover:text-text-primary h-6 w-6 shrink-0"
                onClick={toggleCollapsed}
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <div className="flex justify-center py-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="text-text-muted hover:text-text-primary h-6 w-6"
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Project switcher */}
        {!isCollapsed && (
          <div className="px-3 pb-3">
            <Select
              value={activeProjectId ? String(activeProjectId) : ''}
              onValueChange={(v) => {
                const newId = parseInt(v, 10);
                setActiveProjectId(newId);

                // Stay on the same page but refresh data,
                // UNLESS we are on a detail page for a specific spec or session.
                // Since those belong to a specific project, we should redirect to their lists.
                if (pathname.startsWith('/specs/') && pathname !== '/specs/new') {
                  router.push('/specs');
                } else if (pathname.startsWith('/sessions/')) {
                  router.push('/sessions');
                } else {
                  router.refresh();
                }
              }}
            >
              <SelectTrigger className="border-border-default bg-bg-elevated h-auto w-full border px-2.5 py-1.5 text-xs [&>svg:last-child]:hidden">
                <span className="text-text-muted flex-1 truncate font-mono">{projectPath}</span>
                <ChevronDown className="text-text-muted ml-1 h-3 w-3 shrink-0" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)} className="font-mono text-xs">
                    ~/{p.slug}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            const isNotifications = label === 'Notifications';
            const showBadge = isNotifications && unreadCount > 0;
            const badgeText = unreadCount > 9 ? '9+' : String(unreadCount);

            const linkEl = (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded px-2.5 py-2 text-sm transition-colors',
                  isCollapsed && 'relative justify-center px-2',
                  active
                    ? 'bg-bg-elevated text-text-primary'
                    : 'text-text-secondary hover:bg-bg-elevated/60 hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && label}
                {!isCollapsed && showBadge && (
                  <PixelBadge
                    variant="violet"
                    className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full p-0 text-[9px] shadow-sm"
                  >
                    {badgeText}
                  </PixelBadge>
                )}
                {isCollapsed && showBadge && (
                  <PixelBadge
                    variant="violet"
                    className="absolute top-2 right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full p-0 text-[8px] shadow-sm"
                  >
                    {badgeText}
                  </PixelBadge>
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            }
            return linkEl;
          })}
        </nav>

        {/* Systems + footer */}
        <SidebarBottom collapsed={isCollapsed} />
      </aside>
    </TooltipProvider>
  );
}
