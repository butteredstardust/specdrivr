'use client';

import { Fragment } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, User, Shield, LogOut, Keyboard, Command, ChevronDown } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useShell } from '@/components/shell/shell-context';
import { usePolling } from '@/hooks/use-polling';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
  const crumbs =
    breadcrumbs ??
    (pathname === '/'
      ? [{ label: PATH_LABELS['/'] ?? 'Mission Control' }]
      : [{ label: PATH_LABELS['/'] ?? 'Mission Control', href: '/' }, ...autoCrumbs.slice(0, -1)]);

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
    <header className="border-line bg-surface-raised flex h-16 items-center gap-4 border-b px-8">
      {/* Breadcrumbs */}
      <div className="flex flex-1 items-center overflow-hidden">
        <Breadcrumb>
          <BreadcrumbList className="flex-nowrap">
            {crumbs.map((crumb, i) => (
              <Fragment key={crumb.href ?? i}>
                {i > 0 && <BreadcrumbSeparator className="opacity-40" />}
                <BreadcrumbItem className="overflow-hidden">
                  {pathname === '/' && !crumb.href ? (
                    <h1 className="text-fg truncate text-lg font-semibold tracking-[-0.01em]">
                      {crumb.label}
                    </h1>
                  ) : !crumb.href ? (
                    <BreadcrumbPage className="text-fg truncate font-medium">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={crumb.href}
                        className="text-fg-muted hover:text-fg truncate transition-colors"
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
              className="text-fg-secondary hover:text-fg relative h-9 w-9 transition-colors"
              suppressHydrationWarning
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <Badge
                  variant="info"
                  className="border-surface-raised absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 p-0 text-[10px]"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="border-line bg-surface-raised shadow-popover mt-2 max-h-[480px] w-[380px] p-0"
            align="end"
          >
            <NotificationPanel />
          </PopoverContent>
        </Popover>

        {/* Theme toggle */}
        <div className="border-line-subtle h-4 w-px border-l" />
        <ThemeToggle />

        {/* Shortcuts chip */}
        <Button
          variant="ghost"
          size="icon"
          className="text-fg-muted hover:text-fg h-9 w-9 transition-colors"
          onClick={() => setShortcutsOpen(true)}
          title="Keyboard shortcuts"
        >
          <Command className="h-[18px] w-[18px]" />
        </Button>

        <div className="border-line-subtle mr-1 h-4 w-px border-l" />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="hover:bg-surface-inset/50 flex h-10 items-center gap-2 rounded-full pr-1 pl-1 transition-colors"
              suppressHydrationWarning
            >
              <Avatar className="border-line h-8 w-8 border">
                <AvatarFallback className="bg-surface-inset/10 text-accent text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="text-fg-muted h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="shadow-popover mt-2 w-64">
            <div className="px-3 py-3">
              <p className="text-fg text-sm font-semibold">{user?.name}</p>
              <p className="text-fg-muted truncate text-xs">{user?.email}</p>
              {user?.role && (
                <div className="mt-2">
                  <Badge variant="info" className="font-mono text-[10px] tracking-[0.08em]">
                    {user.role}
                  </Badge>
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer py-2">
              <Link href="/settings/profile" className="flex items-center gap-2.5">
                <User className="text-fg-muted h-4 w-4" />
                <span>Profile Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer py-2">
              <Link href="/settings/security" className="flex items-center gap-2.5">
                <Shield className="text-fg-muted h-4 w-4" />
                <span>Security</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer py-2">
              <Link href="/settings/notifications" className="flex items-center gap-2.5">
                <Bell className="text-fg-muted h-4 w-4" />
                <span>Notifications</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShortcutsOpen(true)}
              className="cursor-pointer py-2"
            >
              <Keyboard className="text-fg-muted h-4 w-4" />
              <span>Keyboard Shortcuts</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-danger focus:text-danger cursor-pointer py-2"
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
