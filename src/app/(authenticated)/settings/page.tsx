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
      <div className="mb-8">
        <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)]">Settings</h1>
        <p className="text-[13px] text-text-secondary">
          Manage your application configuration
        </p>
      </div>

      {settingsGroups.map((group, groupIndex) => (
        <div key={group.title} className="mb-6">
          <h2 className="text-[11px] text-text-tertiary text-text-tertiary mb-2 px-4 uppercase tracking-wide ">
            {group.title}
          </h2>

          <div className="bg-bg-elevated border border-border-default rounded-[8px] shadow-sm ios overflow-hidden">
            {group.items.map((item, itemIndex) => (
              <div
                key={item.label}
                className={`
                  flex items-center px-4 py-[13px] 
                  ${itemIndex < group.items.length - 1
                    ? 'border-b border-opacity-12 border-ios'
                    : ''
                  }
                  ${item.label === 'Appearance' ? 'cursor-pointer hover:bg-opacity-50 hover:bg-blue-500/10' : ''}
                `}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-[4px] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-tertiary)]" >
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0 ml-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] text-ios-primary font-medium">
                      {item.label}
                    </h3>

                    {item.label === 'Appearance' ? (
                      <div className="ml-2">
                        <ThemeToggle />
                      </div>
                    ) : (
                      <span className="text-[13px] text-text-tertiary ml-2">
                        {item.value}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[12px] text-text-tertiary mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>

                {item.label !== 'Appearance' && (
                  <div className="ml-2">
                    <svg
                      className="w-5 h-5 text-text-tertiary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-8 text-center px-6">
        <p className="text-[11px] text-text-tertiary">
          Spec-Drivr v{appVersion} • Built with Next.js
        </p>
        <p className="text-[11px] text-text-tertiary mt-1">
          Configuration loaded from .env.local
        </p>
      </div>
    </div>
  );
}
