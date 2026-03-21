'use client';

import { Fragment } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, User, Shield, LogOut, Keyboard, Command } from 'lucide-react';
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

  const { data: notifData } = usePolling<NotificationData>({
    url: '/api/v1/notifications?unread=true&limit=1',
    interval: 30_000,
  });

  const unreadCount = notifData?.meta?.total ?? 0;

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
    <header className="border-border-default bg-bg-surface flex h-14 items-center gap-4 border-b px-6">
      {/* Breadcrumbs */}
      <div className="flex-1">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/" className="text-text-muted hover:text-text-primary">
                  {PATH_LABELS['/'] ?? 'Home'}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {crumbs.map((crumb, i) => (
              <Fragment key={crumb.href ?? i}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {i === crumbs.length - 1 || !crumb.href ? (
                    <BreadcrumbPage className="text-text-primary">{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href} className="text-text-muted hover:text-text-primary">
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
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
              suppressHydrationWarning
            >
              <Bell className="text-text-secondary h-4 w-4" />
              {unreadCount > 0 && (
                <PixelBadge
                  variant="violet"
                  className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full p-0 text-[9px] shadow-sm"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </PixelBadge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="border-border-default bg-bg-surface max-h-[480px] w-[380px] p-0"
            align="end"
          >
            <NotificationPanel />
          </PopoverContent>
        </Popover>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Shortcuts chip */}
        <Button
          variant="ghost"
          size="icon"
          className="text-text-muted h-8 w-8"
          onClick={() => setShortcutsOpen(true)}
          title="Keyboard shortcuts"
        >
          <Command className="h-4 w-4" />
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0" suppressHydrationWarning>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-accent-violet/20 text-accent-violet text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2.5">
              <p className="text-text-primary text-sm font-semibold">{user?.name}</p>
              <p className="text-text-muted truncate text-xs">{user?.email}</p>
              {user?.role && (
                <span className="text-text-muted mt-1 inline-block font-mono text-[11px] tracking-[0.08em] uppercase">
                  {user.role}
                </span>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/profile" className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/security" className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" />
                Security
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/notifications" className="flex items-center gap-2">
                <Bell className="h-3.5 w-3.5" />
                Notifications
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShortcutsOpen(true)}
              className="flex items-center gap-2"
            >
              <Keyboard className="h-3.5 w-3.5" />
              Keyboard Shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-status-red flex items-center gap-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
