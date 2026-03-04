import { Logo } from '@/components/logo';
import { ProjectSidebarWrapper } from '@/components/project-sidebar-wrapper';
import { getProjects } from '@/lib/actions';
import { ThemeToggle } from '@/components/theme-toggle';
import { DatabaseStatus } from '@/components/database-status';
import { UserMenu } from '@/components/user-menu';

interface SettingItem {
  label: string;
  value: string;
  icon: string;
  description?: string;
}

interface SettingGroup {
  title: string;
  items: SettingItem[];
}

interface SettingsPageProps {}

export default async function SettingsPage({}: SettingsPageProps) {
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
          icon: '💾',
          description: 'PostgreSQL connection string',
        },
        {
          label: 'Database Type',
          value: 'PostgreSQL 16',
          icon: '🗄️',
        },
      ],
    },
    {
      title: 'Authentication',
      items: [
        {
          label: 'Agent Token',
          value: maskedAgentToken,
          icon: '🔑',
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
          icon: '📱',
        },
        {
          label: 'Framework',
          value: 'Next.js 14',
          icon: '⚛️',
        },
        {
          label: 'Framework Type',
          value: 'App Router',
          icon: '🚀',
        },
        {
          label: 'Node.js',
          value: process.version,
          icon: '🟢',
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          label: 'Environment',
          value: process.env.NODE_ENV || 'development',
          icon: '⚙️',
        },
        {
          label: 'Appearance',
          value: '',
          icon: '🌙',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-ios-system">
      <header className="sticky top-0 z-50 ios-header border-b ios">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Logo size="large" className="min-w-40" />
            </div>
            <div className="flex items-center gap-3">
              <DatabaseStatus />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen pt-0">
        <ProjectSidebarWrapper projects={projects} />

        <main className="flex-1 overflow-y-auto bg-ios-system ios-font">
          <div className="max-w-3xl mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="ios-title-large text-ios-primary mb-2 ios-font-display">
                Settings
              </h1>
              <p className="ios-body text-ios-secondary ios-font-text">
                Manage your application configuration
              </p>
            </div>

            {settingsGroups.map((group, groupIndex) => (
              <div key={group.title} className="mb-6">
                <h2 className="ios-footnote ios-placeholder mb-2 px-4 uppercase tracking-wide ios-font-text">
                  {group.title}
                </h2>

                <div className="ios-card shadow-sm ios overflow-hidden">
                  {group.items.map((item, itemIndex) => (
                    <div
                      key={item.label}
                      className={`
                        flex items-center px-4 py-[13px] ios-font-text
                        ${itemIndex < group.items.length - 1
                          ? 'border-b border-opacity-12 border-ios'
                          : ''
                        }
                        ${item.label === 'Appearance' ? 'cursor-pointer hover:bg-opacity-50 hover:bg-blue-500/10' : ''}
                      `}
                    >
                      <div className="flex-shrink-0 w-8 h-8 ios-radius-small bg-ios-secondary flex items-center justify-center text-lg" style={{ backgroundColor: 'var(--ios-bg-secondary)' }}>
                        {item.icon}
                      </div>

                      <div className="flex-1 min-w-0 ml-3">
                        <div className="flex items-center justify-between">
                          <h3 className="ios-body text-ios-primary font-medium">
                            {item.label}
                          </h3>

                          {item.label === 'Appearance' ? (
                            <div className="ml-2">
                              <ThemeToggle />
                            </div>
                          ) : (
                            <span className="ios-body text-ios-placeholder ml-2">
                              {item.value}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="ios-subheadline text-ios-placeholder mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {item.label !== 'Appearance' && (
                        <div className="ml-2">
                          <svg
                            className="w-5 h-5 ios-placeholder"
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

            <div className="mt-8 text-center px-6 ios-font-text">
              <p className="ios-caption text-ios-placeholder">
                Spec-Drivr v{appVersion} • Built with Next.js
              </p>
              <p className="ios-caption text-ios-placeholder mt-1">
                Configuration loaded from .env.local
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
