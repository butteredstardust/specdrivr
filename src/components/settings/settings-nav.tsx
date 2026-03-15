'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/db/schema';

interface NavItem {
  href: string;
  label: string;
  /** If set, hides the item when the user's role is in this list */
  hideForRoles?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
  /** Injected slot rendered immediately after this group */
  afterSlot?: 'danger-zone';
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'ACCOUNT',
    items: [
      { href: '/settings/profile', label: 'Profile' },
      { href: '/settings/security', label: 'Security' },
      { href: '/settings/notifications', label: 'Notifications' },
    ],
  },
  {
    label: 'PROJECT',
    items: [
      { href: '/settings/general', label: 'General' },
      { href: '/settings/team', label: 'Team' },
      { href: '/settings/agent', label: 'Agent' },
      { href: '/settings/integrations', label: 'Integrations' },
      { href: '/settings/usage', label: 'Usage' },
      { href: '/settings/audit', label: 'Audit Log', hideForRoles: ['member', 'viewer'] },
    ],
    afterSlot: 'danger-zone',
  },
  {
    label: 'DEVELOPER',
    items: [
      { href: '/settings/webhooks', label: 'Webhook Log' },
      { href: '/settings/security', label: 'API Tokens' },
    ],
  },
];

interface SettingsNavProps {
  userRole: UserRole;
}

export function SettingsNav({ userRole }: SettingsNavProps) {
  const pathname = usePathname();

  const isDangerActive =
    pathname === '/settings/danger' || pathname.startsWith('/settings/danger/');

  return (
    <nav className="flex w-[180px] shrink-0 flex-col gap-0">
      {NAV_GROUPS.map((group, groupIdx) => (
        <div key={group.label}>
          <p
            className={cn(
              'text-text-muted px-3 py-1 font-mono text-xs tracking-widest uppercase',
              groupIdx === 0 ? 'mt-0' : 'mt-4'
            )}
          >
            {group.label}
          </p>
          {group.items
            .filter((item) => !item.hideForRoles?.includes(userRole))
            .map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-sm px-3 py-1.5 text-sm transition-colors',
                    active
                      ? 'border-accent-violet bg-accent-violet/10 text-accent-violet border-l-2 pl-[10px]'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

          {group.afterSlot === 'danger-zone' && (
            <Link
              href="/settings/danger"
              className={cn(
                'mt-4 flex items-center px-3 py-1.5 font-mono text-xs tracking-widest uppercase transition-colors',
                isDangerActive
                  ? 'border-accent-violet bg-accent-violet/10 text-accent-violet border-l-2 pl-[10px]'
                  : 'text-status-red/80 hover:text-status-red'
              )}
            >
              DANGER ZONE
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
