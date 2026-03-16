'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/db/schema';

interface NavItem {
  href: string;
  label: string;
  hideForRoles?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
  afterSlot?: 'danger-zone';
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Account',
    items: [
      { href: '/settings/profile', label: 'Profile' },
      { href: '/settings/security', label: 'Security' },
      { href: '/settings/notifications', label: 'Notifications' },
    ],
  },
  {
    label: 'Project',
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
    label: 'Developer',
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
    <nav className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-muted-foreground mb-1 px-2 font-mono text-[10px] tracking-[0.15em] uppercase">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items
              .filter((item) => !item.hideForRoles?.includes(userRole))
              .map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'rounded px-2 py-1.5 text-sm transition-colors',
                      active
                        ? 'bg-accent-violet/10 text-accent-violet font-medium'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
          </div>

          {group.afterSlot === 'danger-zone' && (
            <Link
              href="/settings/danger"
              className={cn(
                'mt-3 block rounded px-2 py-1.5 font-mono text-xs tracking-wider uppercase transition-colors',
                isDangerActive
                  ? 'bg-status-red/10 text-status-red font-medium'
                  : 'text-status-red/70 hover:text-status-red'
              )}
            >
              Danger Zone
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
