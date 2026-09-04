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
import { StatusIcon } from '@/components/ui/status-icon';
import { BrandLockup, BrandMark } from '@/components/ui/brand-mark';
import { useSystemHealth } from '@/components/layout/systems-bar';
import { useShell } from '@/components/shell/shell-context';
import { Badge } from '@/components/ui/badge';
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
      return 'bg-success';
    case 'warn':
      return 'bg-warning';
    case 'error':
      return 'bg-danger';
    default:
      return 'bg-fg-muted';
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
        <div className="group flex cursor-default flex-col items-center gap-1">
          <div className="relative transition-transform duration-200 group-hover:scale-110">
            <StatusIcon size={20} status={healthToExpr(state)} />
            <span
              className={cn(
                'border-surface-raised absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border',
                healthDot(state)
              )}
            />
          </div>
          <span className="text-fg-muted group-hover:text-fg-secondary mt-0.5 font-mono text-[10px] tracking-[0.08em] uppercase transition-colors">
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
      ? 'text-fg-muted'
      : health.overall === 'degraded'
        ? 'text-danger'
        : 'text-fg-muted';

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
      <div className="border-line-subtle flex flex-col items-center gap-3 border-t py-4">
        <StatusIcon size={20} status={overallExpr} />
      </div>
    );
  }

  return (
    <div className="border-line-subtle border-t">
      {/* Systems icons */}
      <div className="px-4 pt-4 pb-2">
        <span className="text-fg-muted mb-3 block px-1 font-mono text-[11px] tracking-[0.1em] uppercase opacity-70">
          Systems
        </span>
        <div className="flex items-end justify-between px-1">
          <SystemIcon label="Git" state={health.git} tooltip={gitTooltip} />
          <SystemIcon label="API" state={health.api} tooltip={apiTooltip} />
          <SystemIcon label="Agt" state={health.agt} tooltip={agtTooltip} />
          <SystemIcon label="PG" state={health.pg} tooltip={pgTooltip} />
        </div>
      </div>

      {/* Daemon status footer */}
      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center gap-2">
          <StatusIcon size={20} status={overallExpr} />
          <span className={cn('font-mono text-[11px] tracking-[0.08em] uppercase', statusClass)}>
            DAEMON · {statusText}
          </span>
        </div>
        <div className="mt-1.5 px-0.5">
          <span className="text-fg-muted/50 font-mono text-[10px] tracking-wide">v0.1.0</span>
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

  const { data: notifData } = usePolling<{ unreadCount: number }>({
    url: '/api/v1/notifications?unreadOnly=true&limit=1',
    interval: 30_000,
  });
  const unreadCount = notifData?.unreadCount ?? 0;

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
          'border-line bg-surface-raised flex h-full flex-shrink-0 flex-col border-r transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-6">
          {isCollapsed ? (
            <div className="flex w-full justify-center">
              <BrandMark size={32} />
            </div>
          ) : (
            <>
              <div className="flex flex-1 flex-col gap-1">
                <BrandLockup size={32} />
                {devMode && (
                  <Badge
                    variant="warning"
                    className="mt-0.5 w-fit origin-left scale-90 font-mono text-[10px]"
                  >
                    Dev mode
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-fg-muted hover:text-fg ml-auto h-7 w-7 shrink-0 transition-colors"
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
          <div className="flex justify-center py-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-fg-muted hover:text-fg h-8 w-8 transition-colors"
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Project switcher */}
        {!isCollapsed && (
          <div className="px-4 pb-5">
            <Select
              value={activeProjectId ? String(activeProjectId) : ''}
              onValueChange={(v) => {
                const newId = parseInt(v, 10);
                setActiveProjectId(newId);
                if (pathname.startsWith('/specs/') && pathname !== '/specs/new') {
                  router.push('/specs');
                } else if (pathname.startsWith('/sessions/')) {
                  router.push('/sessions');
                } else {
                  router.refresh();
                }
              }}
            >
              <SelectTrigger className="border-line-subtle bg-surface-inset/50 hover:bg-surface-inset h-auto w-full border px-3 py-2 text-xs transition-colors [&>svg:last-child]:hidden">
                <div className="flex flex-1 flex-col items-start overflow-hidden text-left">
                  <span className="text-fg-muted mb-0.5 font-mono text-[10px] tracking-[0.08em] uppercase opacity-70">
                    Active Project
                  </span>
                  <span className="text-fg-secondary w-full truncate font-mono font-medium">
                    {projectPath}
                  </span>
                </div>
                <ChevronDown className="text-fg-muted ml-1 h-3.5 w-3.5 shrink-0" />
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
        <nav className="flex-1 space-y-1 px-3">
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
                  'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isCollapsed && 'relative justify-center px-2',
                  active
                    ? 'bg-surface-inset text-fg'
                    : 'text-fg-secondary hover:bg-surface-inset/40 hover:text-fg'
                )}
              >
                <Icon
                  className={cn(
                    'h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110',
                    active ? 'text-accent' : 'text-fg-secondary'
                  )}
                />
                {!isCollapsed && <span>{label}</span>}
                {!isCollapsed && showBadge && (
                  <Badge
                    variant="info"
                    className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full p-0 text-[10px]"
                  >
                    {badgeText}
                  </Badge>
                )}
                {isCollapsed && showBadge && (
                  <Badge
                    variant="info"
                    className="absolute top-2 right-2 flex h-4 min-w-4 items-center justify-center rounded-full p-0 text-[10px]"
                  >
                    {badgeText}
                  </Badge>
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    {label}
                  </TooltipContent>
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
