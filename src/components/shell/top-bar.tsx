'use client';

import { Fragment } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, User, Shield, LogOut, Keyboard, Command, ChevronDown } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PixelBadge } from '@/components/ui/pixel-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationPanel } from '@/components/notifications/notification-panel';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface NotificationData {
  meta: { total: number };
}

interface TopBarProps {
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

const PATH_LABELS: Record<string, string> = {
  '/': 'Mission Control',
  '/projects': 'Projects',
  '/specs': 'Specifications',
  '/sessions': 'Sessions',
  '/settings': 'Settings',
  '/notifications': 'Notifications',
};

export function TopBar({ breadcrumbs }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setShortcutsOpen, pageLabel } = useShell();

  const { data: notifData } = usePolling<{ unreadCount: number }>({
    url: '/api/v1/notifications?unreadOnly=true&limit=1',
    interval: 30_000,
  });

  const unreadCount = notifData?.unreadCount ?? 0;

  const segments = pathname.split('/').filter(Boolean);
  const autoCrumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    const isLast = i === segments.length - 1;
    const label = PATH_LABELS[path] ?? (isLast && pageLabel ? pageLabel : seg);
    return { label, href: path };
  });
  const crumbs = breadcrumbs ?? autoCrumbs;

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/login');
  };

  return (
    <header className="border-border-default bg-bg-surface flex h-16 items-center gap-4 border-b px-8">
      {/* Breadcrumbs */}
      <div className="flex flex-1 items-center overflow-hidden">
        <Breadcrumb>
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href="/"
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  {PATH_LABELS['/'] ?? 'Home'}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {crumbs.map((crumb, i) => (
              <Fragment key={crumb.href ?? i}>
                <BreadcrumbSeparator className="opacity-40" />
                <BreadcrumbItem className="overflow-hidden">
                  {i === crumbs.length - 1 || !crumb.href ? (
                    <BreadcrumbPage className="text-text-primary truncate font-medium">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={crumb.href}
                        className="text-text-muted hover:text-text-primary truncate transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-text-secondary hover:text-text-primary relative h-9 w-9 transition-colors"
              suppressHydrationWarning
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <PixelBadge
                  variant="violet"
                  className="border-bg-surface absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 p-0 text-[8px] shadow-sm"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </PixelBadge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="border-border-default bg-bg-surface cyber-glow mt-2 max-h-[480px] w-[380px] p-0 shadow-lg"
            align="end"
          >
            <NotificationPanel />
          </PopoverContent>
        </Popover>

        {/* Theme toggle */}
        <div className="border-border-muted h-4 w-px border-l" />
        <ThemeToggle />

        {/* Shortcuts chip */}
        <Button
          variant="ghost"
          size="icon"
          className="text-text-muted hover:text-text-primary h-9 w-9 transition-colors"
          onClick={() => setShortcutsOpen(true)}
          title="Keyboard shortcuts"
        >
          <Command className="h-[18px] w-[18px]" />
        </Button>

        <div className="border-border-muted mr-1 h-4 w-px border-l" />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="hover:bg-bg-elevated/50 flex h-10 items-center gap-2 rounded-full pr-1 pl-1 transition-colors"
              suppressHydrationWarning
            >
              <Avatar className="border-border-default h-8 w-8 border shadow-sm">
                <AvatarFallback className="bg-accent-violet/10 text-accent-violet text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="text-text-muted h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="cyber-glow mt-2 w-64 shadow-lg">
            <div className="px-3 py-3">
              <p className="text-text-primary text-sm font-semibold">{user?.name}</p>
              <p className="text-text-muted truncate text-xs">{user?.email}</p>
              {user?.role && (
                <div className="mt-2">
                  <PixelBadge variant="violet" className="font-mono text-[9px] tracking-[0.1em]">
                    {user.role}
                  </PixelBadge>
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer py-2">
              <Link href="/settings/profile" className="flex items-center gap-2.5">
                <User className="text-text-muted h-4 w-4" />
                <span>Profile Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer py-2">
              <Link href="/settings/security" className="flex items-center gap-2.5">
                <Shield className="text-text-muted h-4 w-4" />
                <span>Security</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer py-2">
              <Link href="/settings/notifications" className="flex items-center gap-2.5">
                <Bell className="text-text-muted h-4 w-4" />
                <span>Notifications</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShortcutsOpen(true)}
              className="cursor-pointer py-2"
            >
              <Keyboard className="text-text-muted h-4 w-4" />
              <span>Keyboard Shortcuts</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-status-red focus:text-status-red cursor-pointer py-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
