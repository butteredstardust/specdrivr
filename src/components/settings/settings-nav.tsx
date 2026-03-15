'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  /** If set, hides the item when the user's role is in this list */
  hideForRoles?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
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
  },
  {
    label: 'DANGER ZONE',
    items: [{ href: '/settings/danger', label: 'Danger Zone' }],
  },
  {
    label: 'DEVELOPER',
    items: [
      { href: '/settings/webhooks', label: 'Webhook Log' },
      { href: '/settings/tokens', label: 'API Tokens' },
    ],
  },
];

interface SettingsNavProps {
  userRole: string;
}

export function SettingsNav({ userRole }: SettingsNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex w-[180px] shrink-0 flex-col gap-0">
      {NAV_GROUPS.map((group, groupIdx) => (
        <div key={group.label}>
          <p
            className={cn(
              'px-3 py-1 font-mono text-xs tracking-widest text-[--text-muted] uppercase',
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
                      ? 'border-l-2 border-[--accent-violet] bg-[--accent-violet]/10 pl-[10px] text-[--accent-violet]'
                      : 'text-[--text-secondary] hover:bg-[--surface-hover] hover:text-[--text-primary]'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
        </div>
      ))}
    </nav>
  );
}
