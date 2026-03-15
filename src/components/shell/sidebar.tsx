'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FolderKanban, FileText, Terminal, Settings } from 'lucide-react';
import { DaemonMascot } from '@/components/ui/daemon-mascot';
import { useShell } from '@/components/shell/shell-context';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SidebarProps {
  projects: Array<{ id: number; name: string; slug: string }>;
}

const NAV_ITEMS = [
  { href: '/', label: 'Mission Control', icon: LayoutDashboard, exact: true },
  { href: '/projects', label: 'Projects', icon: FolderKanban, exact: false },
  { href: '/specs', label: 'Specs', icon: FileText, exact: false },
  { href: '/sessions', label: 'Sessions', icon: Terminal, exact: false },
  { href: '/settings', label: 'Settings', icon: Settings, exact: false },
];

export function Sidebar({ projects }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeProjectId, setActiveProjectId, devMode } = useShell();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="flex h-full w-60 flex-shrink-0 flex-col border-r border-[--border-default] bg-[--bg-surface]">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-[--border-default] px-4 py-4">
        <DaemonMascot size={24} expression="idle" />
        <span className="font-mono text-sm font-bold tracking-widest text-[--text-primary]">
          SPECDRIVR
        </span>
        {devMode && (
          <Badge className="ml-auto border-[--phosphor-amber]/30 bg-[--phosphor-amber]/20 font-mono text-[10px] text-[--phosphor-amber]">
            DEV
          </Badge>
        )}
      </div>

      {/* Project Switcher */}
      <div className="border-b border-[--border-default] px-3 py-3">
        <Select
          value={activeProjectId ? String(activeProjectId) : ''}
          onValueChange={(v) => {
            setActiveProjectId(parseInt(v, 10));
            router.push('/specs');
          }}
        >
          <SelectTrigger className="h-8 border-[--border-default] bg-[--bg-elevated] text-xs">
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

      {/* Nav */}
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                active
                  ? 'border-l-2 border-[--accent-violet] bg-[--accent-violet]/10 text-[--accent-violet]'
                  : 'border-l-2 border-transparent text-[--text-secondary] hover:bg-[--bg-elevated] hover:text-[--text-primary]'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div className="flex items-center gap-2 border-t border-[--border-default] px-4 py-3">
        <DaemonMascot size={24} expression="idle" />
        <span className="font-mono text-xs tracking-widest text-[--text-muted] uppercase">
          SYSTEM READY
        </span>
      </div>
    </aside>
  );
}
