'use client';

import { Fragment } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell } from 'lucide-react';
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
  const { user, setShortcutsOpen } = useShell();

  const { data: notifData } = usePolling<NotificationData>({
    url: '/api/v1/notifications?unreadOnly=true&limit=1',
    interval: 30_000,
  });

  const unreadCount = notifData?.meta?.total ?? 0;

  const segments = pathname.split('/').filter(Boolean);
  const autoCrumbs = segments.map((seg, i) => ({
    label: PATH_LABELS['/' + segments.slice(0, i + 1).join('/')] ?? seg,
    href: '/' + segments.slice(0, i + 1).join('/'),
  }));
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
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="text-text-secondary h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="bg-accent-violet absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center p-0 text-[10px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
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

        {/* Shortcuts chip */}
        <Button
          variant="ghost"
          size="sm"
          className="border-border-muted text-text-muted h-6 border px-1.5 font-mono text-[10px]"
          onClick={() => setShortcutsOpen(true)}
        >
          ?
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-accent-violet/20 text-accent-violet text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2">
              <p className="text-text-primary text-sm font-medium">{user?.name}</p>
              <p className="text-text-muted truncate text-xs">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShortcutsOpen(true)}>
              Keyboard Shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-status-red">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
