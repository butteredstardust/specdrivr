import {
  Database,
  Server,
  KeyRound,
  Tag,
  Layers,
  Rocket,
  Terminal,
  Globe,
  Palette
} from 'lucide-react';
import { getProjects } from '@/lib/actions';
import { ThemeToggle } from '@/components/theme-toggle';

interface SettingItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
}

interface SettingGroup {
  title: string;
  items: SettingItem[];
}

interface SettingsPageProps { }

export default async function SettingsPage({ }: SettingsPageProps) {
  const projectsResult = await getProjects();
  let projects: any[] = [];
  if (projectsResult.success && projectsResult.projects) {
    projects = projectsResult.projects;
  }

  const databaseUrl = process.env.DATABASE_URL || '';
  const maskedDatabaseUrl = databaseUrl
    ? 'postgresql://***:***@***:***'
    : 'Not configured';

  const agentToken = process.env.AGENT_TOKEN || '';
  const maskedAgentToken = agentToken
    ? agentToken.substring(0, 3) + '...' + agentToken.substring(agentToken.length - 3)
    : 'Not configured';

  const appVersion = process.env.npm_package_version || '0.1.0';
  const nextJsVersion = '14.2.35';

  const settingsGroups: SettingGroup[] = [
    {
      title: 'Database',
      items: [
        {
          label: 'Connection URL',
          value: maskedDatabaseUrl,
          icon: <Database size={16} />,
          description: 'PostgreSQL connection string',
        },
        {
          label: 'Database Type',
          value: 'PostgreSQL 16',
          icon: <Server size={16} />,
        },
      ],
    },
    {
      title: 'Authentication',
      items: [
        {
          label: 'Agent Token',
          value: maskedAgentToken,
          icon: <KeyRound size={16} />,
          description: 'API authentication token',
        },
      ],
    },
    {
      title: 'Application',
      items: [
        {
          label: 'Version',
          value: appVersion,
          icon: <Tag size={16} />,
        },
        {
          label: 'Framework',
          value: 'Next.js 14',
          icon: <Layers size={16} />,
        },
        {
          label: 'Framework Type',
          value: 'App Router',
          icon: <Rocket size={16} />,
        },
        {
          label: 'Node.js',
          value: process.version,
          icon: <Terminal size={16} />,
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          label: 'Environment',
          value: process.env.NODE_ENV || 'development',
          icon: <Globe size={16} />,
        },
        {
          label: 'Appearance',
          value: '',
          icon: <Palette size={16} />,
        },
      ],
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-[var(--sp-8)]">
        <h1 className="text-[var(--font-size-lg)] font-semibold text-[var(--color-text-primary)]">Settings</h1>
        <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
          Manage your application configuration
        </p>
      </div>

      {settingsGroups.map((group) => (
        <div key={group.title} className="mb-[var(--sp-6)]">
          <h2 className="text-[var(--font-size-xs)] text-[var(--color-text-tertiary)] mb-[var(--sp-2)] px-[var(--sp-4)] uppercase tracking-wider font-semibold">
            {group.title}
          </h2>

          <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden">
            {group.items.map((item, itemIndex) => (
              <div
                key={item.label}
                className={`
                  flex items-center px-[var(--sp-4)] py-[var(--sp-3)]
                  ${itemIndex < group.items.length - 1
                    ? 'border-b border-[var(--color-border-default)]'
                    : ''
                  }
                  ${item.label === 'Appearance' ? 'cursor-pointer hover:bg-[var(--color-bg-hovered)]' : ''}
                `}
              >
                <div className="flex-shrink-0 w-[32px] h-[32px] rounded-[var(--radius-sm)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-tertiary)]" >
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0 ml-[var(--sp-3)]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[var(--font-size-sm)] text-[var(--color-text-primary)] font-medium">
                      {item.label}
                    </h3>

                    {item.label === 'Appearance' ? (
                      <div className="ml-[var(--sp-2)]">
                        <ThemeToggle />
                      </div>
                    ) : (
                      <span className="text-[var(--font-size-sm)] text-[var(--color-text-tertiary)] ml-[var(--sp-2)]">
                        {item.value}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[var(--font-size-sm)] text-[var(--color-text-tertiary)] mt-[2px]">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-[var(--sp-8)] text-center px-[var(--sp-6)]">
        <p className="text-[var(--font-size-xs)] text-[var(--color-text-tertiary)]">
          Spec-Drivr v{appVersion} &bull; Built with Next.js
        </p>
        <p className="text-[var(--font-size-xs)] text-[var(--color-text-tertiary)] mt-[var(--sp-1)]">
          Configuration loaded from .env.local
        </p>
      </div>
    </div>
  );
}
