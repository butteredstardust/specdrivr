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
  isBoolean?: boolean;
  booleanValue?: boolean;
}

interface SettingGroup {
  title: string;
  items: SettingItem[];
}

interface SettingsPageProps {}

export default async function SettingsPage({}: SettingsPageProps) {
  // Get all projects for the sidebar
  const projectsResult = await getProjects();
  let projects: any[] = [];
  if (projectsResult.success && projectsResult.projects) {
    projects = projectsResult.projects;
  }

  // Database configuration
  const databaseUrl = process.env.DATABASE_URL || '';
  const maskedDatabaseUrl = databaseUrl
    ? 'postgresql://***:***@***:***'
    : 'Not configured';

  // Agent configuration
  const agentToken = process.env.AGENT_TOKEN || '';
  const maskedAgentToken = agentToken
    ? agentToken.substring(0, 3) + '...' + agentToken.substring(agentToken.length - 3)
    : 'Not configured';

  // Application info
  const appVersion = process.env.npm_package_version || '0.1.0';
  const nextJsVersion = '14.2.35';

  // Define settings groups
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
    <div className="min-h-screen:bg-systemBackground dark:bg-darkGray900">
      {/* iOS-style Navigation Header */}
      <header className="sticky top-0 z-50 bg-[rgba(255,255,255,0.8)] dark:bg-[rgba(28,28,30,0.8)] backdrop-blur-md border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.65)]">
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

        <main className="flex-1 overflow-y-auto bg-systemBackground dark:bg-darkGray900">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {/* iOS-style Large Title */}
            <div className="mb-8">
              <h1 className="text-[34px] font-bold text-black dark:text-white mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif' }}>
                Settings
              </h1>
              <p className="text-[17px] text-[#3C3C43] dark:text-[#AEAEB2]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}>
                Manage your application configuration
              </p>
            </div>

            {/* Settings Groups */}
            {settingsGroups.map((group, groupIndex) => (
              <div key={group.title} className="mb-6">
                {/* Group Title */}
                <h2 className="text-[13px] font-semibold text-[#3C3C43]/[0.6] dark:text-[#FFFFFF]/[0.6] uppercase tracking-wide mb-2 px-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}>
                  {group.title}
                </h2>

                {/* iOS-style Grouped List */}
                <div className="bg-white dark:bg-[#1C1C1E] rounded-[12px] overflow-hidden shadow-sm border border-[#C6C6C829] dark:border-[#38383A52]">
                  {group.items.map((item, itemIndex) => (
                    <div
                      key={item.label}
                      className={`
                        flex items-center px-4 py-[13px]
                        ${itemIndex < group.items.length - 1
                          ? 'border-b border-[rgba(60,60,67,0.12)] dark:border-[rgba(84,84,88,0.65)]'
                          : ''
                        }
                        ${item.label === 'Appearance' ? 'cursor-pointer hover:bg-[#007AFF]/[0.1] dark:hover:bg-[#0A84FF]/[0.1]' : ''}
                      `}
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-[8px] bg-[#F2F2F7] dark:bg-[#2C2C2E] flex items-center justify-center text-lg">
                        {item.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 ml-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[17px] font-medium text-black dark:text-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}>
                            {item.label}
                          </h3>

                          {/* Value or Theme Toggle */}
                          {item.label === 'Appearance' ? (
                            <div className="ml-2">
                              <ThemeToggle />
                            </div>
                          ) : (
                            <span className="text-[17px] text-[#8E8E93] ml-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}>
                              {item.value}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[15px] text-[#8E8E93] mt-0.5" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}>
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Chevron for navigation items */}
                      {item.label !== 'Appearance' && (
                        <div className="ml-2">
                          <svg
                            className="w-5 h-5 text-[#C7C7CC] dark:text-[#39393D]"
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

            {/* Footer Info */}
            <div className="mt-8 text-center px-6">
              <p className="text-[13px] text-[#8E8E93]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}>
                Spec-Drivr v{appVersion} • Built with Next.js
              </p>
              <p className="text-[13px] text-[#8E8E93] mt-1" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif' }}>
                Configuration loaded from .env.local
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
