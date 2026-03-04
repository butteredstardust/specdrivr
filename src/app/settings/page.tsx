import { Logo } from '@/components/logo';
import { ProjectSidebarWrapper } from '@/components/project-sidebar-wrapper';
import { getProjects } from '@/lib/actions';
import { notFound } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

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
    .replace(/(postgresql:\/\/)([^:]*)(:)([^@]*)(@)([^:]*)(:\d+)/,
      'postgresql://***:***@***:***');

  // Agent configuration
  const agentToken = process.env.AGENT_TOKEN || '';
  const maskedAgentToken = agentToken
    ? agentToken.substring(0, 3) + '...' + agentToken.substring(agentToken.length - 3)
    : '';

  // NextAuth configuration
  const nextAuthUrl = process.env.NEXTAUTH_URL || '';

  // Application info
  const appVersion = process.env.npm_package_version || '0.1.0';
  const nodeVersion = process.version;
  const nextJsVersion = '14.2.35';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size="large" className="min-w-48" />
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen pt-0">
        <ProjectSidebarWrapper projects={projects} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Welcome section */}
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Theme:</span>
                    <ThemeToggle />
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  This page shows the current application configuration settings. These values are read from your environment configuration and cannot be changed here.
                </p>
                <p className="text-sm text-red-600 font-medium">
                  ⚠️ For security reasons, sensitive credentials are masked in the display above.
                </p>
              </div>
            </div>

            {/* Database Configuration */}
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Database Configuration</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Connection URL</label>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md font-mono text-sm text-gray-900">
                        {maskedDatabaseUrl || '(not set)'}
                      </div>
                      <p className="text-xs text-gray-500">
                        PostgreSQL connection string from DATABASE_URL environment variable
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Database Type</label>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-900">
                        PostgreSQL 16
                      </div>
                      <p className="text-xs text-gray-500">
                        Primary database for project data
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Authentication Configuration */}
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Authentication Configuration</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Agent Token</label>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md font-mono text-sm text-gray-900">
                        {maskedAgentToken || '(not set)'}
                      </div>
                      <p className="text-xs text-gray-500">
                        X-Agent-Token header for agent API authentication
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">NextAuth URL</label>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-900">
                        {nextAuthUrl || '(not set)'}
                      </div>
                      <p className="text-xs text-gray-500">
                        URL for NextAuth authentication
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Information */}
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Application Information</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">App Version</label>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-900">
                        {appVersion}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Node.js Version</label>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-900">
                        {nodeVersion}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Next.js Version</label>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-900">
                        {nextJsVersion}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Framework</label>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-900">
                        Next.js 14 App Router
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration Location */}
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration Location</h2>
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    These settings are loaded from the <code className="px-1 py-0.5 bg-gray-100 rounded text-sm">.env.local</code> file in your project root.
                  </p>
                  <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>File:</strong> <code className="bg-white px-1 py-0.5 rounded text-sm">/Users/tuxgeek/Dev/specdrivr/.env.local</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
