'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Terminal,
  Bell,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { SystemsBar } from '@/components/layout/systems-bar';
import { useShell } from '@/components/shell/shell-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const COLLAPSED_KEY = 'sidebar-collapsed';

interface SidebarProps {
  projects: Array<{ id: number; name: string; slug: string }>;
}

const NAV_ITEMS = [
  { href: '/', label: 'Mission Control', icon: LayoutDashboard, exact: true },
  { href: '/projects', label: 'Projects', icon: FolderKanban, exact: false },
  { href: '/specs', label: 'Specs', icon: FileText, exact: false },
  { href: '/sessions', label: 'Sessions', icon: Terminal, exact: false },
  { href: '/notifications', label: 'Notifications', icon: Bell, exact: false },
  { href: '/settings', label: 'Settings', icon: Settings, exact: false },
];

export function Sidebar({ projects }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeProjectId, setActiveProjectId, devMode } = useShell();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  // Don't render collapsed state until mounted to avoid hydration mismatch
  const isCollapsed = mounted && collapsed;

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          'border-border-default bg-bg-surface flex h-full flex-shrink-0 flex-col border-r transition-all duration-200',
          isCollapsed ? 'w-14' : 'w-60'
        )}
      >
        {/* Logo + collapse toggle */}
        <div className="border-border-default flex items-center gap-2 border-b px-3 py-4">
          {!isCollapsed && <DaemonMascot size={24} expression="idle" />}
          {!isCollapsed && (
            <span className="text-text-primary flex-1 font-mono text-sm font-bold tracking-widest">
              SPECDRIVR
            </span>
          )}
          {!isCollapsed && devMode && (
            <Badge className="border-phosphor-amber/30 bg-phosphor-amber/20 text-phosphor-amber font-mono text-[10px]">
              DEV
            </Badge>
          )}
          {isCollapsed && (
            <div className="flex w-full justify-center">
              <DaemonMascot size={24} expression="idle" />
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="text-text-muted hover:text-text-primary h-6 w-6 shrink-0"
              onClick={toggleCollapsed}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <div className="border-border-default flex justify-center border-b py-2">
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

        {/* Project Switcher */}
        {!isCollapsed && (
          <div className="border-border-default border-b px-3 py-3">
            <Select
              value={activeProjectId ? String(activeProjectId) : ''}
              onValueChange={(v) => {
                setActiveProjectId(parseInt(v, 10));
                router.push('/specs');
              }}
            >
              <SelectTrigger className="border-border-default bg-bg-elevated h-8 text-xs">
                <SelectValue placeholder="Select project…" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            const linkEl = (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center transition-colors',
                  isCollapsed
                    ? 'mx-1 justify-center rounded-md p-2'
                    : 'gap-3 border-l-2 px-4 py-2 text-sm',
                  active
                    ? isCollapsed
                      ? 'bg-accent-violet/10 text-accent-violet'
                      : 'border-accent-violet bg-accent-violet/10 text-accent-violet'
                    : isCollapsed
                      ? 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                      : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary border-transparent'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && label}
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

        {/* Bottom status */}
        <div className="border-border-default border-t">
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-4 py-2">
              <DaemonMascot size={24} expression="idle" />
              <span className="text-text-muted font-mono text-xs tracking-widest uppercase">
                SYSTEM READY
              </span>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center py-2">
              <DaemonMascot size={20} expression="idle" />
            </div>
          )}
          <SystemsBar collapsed={isCollapsed} />
        </div>
      </aside>
    </TooltipProvider>
  );
}
