'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { clientLogger } from '@/lib/logger-client';
import type { UserRole } from '@/db/schema';
import { usePolling } from '@/hooks/use-polling';
import type { PublicAgentConfig } from '@/lib/agent-config-public';
import { TooltipProvider } from '@/components/ui/tooltip';
import { canEdit } from './integrations/shared';
import { GitHubCard } from './integrations/github-card';
import { SlackCard } from './integrations/slack-card';
import { WebhooksCard } from './integrations/webhooks-card';

interface IntegrationsSectionProps {
  projectId: number;
  userRole: UserRole;
}

// ---------------------------------------------------------------------------
// IntegrationsSection — root client component
// ---------------------------------------------------------------------------

export function IntegrationsSection({ projectId, userRole }: IntegrationsSectionProps) {
  const editable = canEdit(userRole);

  const [agentConfig, setAgentConfig] = useState<PublicAgentConfig | null>(null);
  const [configVersion, setConfigVersion] = useState(0);

  const onData = useCallback((data: PublicAgentConfig | null) => {
    setAgentConfig(data);
  }, []);

  const onError = useCallback((err: Error) => {
    clientLogger.error('Failed to load integrations config', err);
    toast.error('Failed to load integration settings');
  }, []);

  const { isLoading, restart: restartConfig } = usePolling<PublicAgentConfig | null>({
    url: `/api/v1/projects/${projectId}/agent-config`,
    interval: 60_000,
    stopWhen: () => true,
    onData,
    onError,
  });

  // Re-fetch fresh config then force child card re-mounts so state is refreshed
  const handleSaved = useCallback(() => {
    restartConfig();
    setConfigVersion((v) => v + 1);
  }, [restartConfig]);

  if (isLoading) {
    return <p className="text-fg-secondary text-sm">Loading integrations…</p>;
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <GitHubCard
          key={`github-${configVersion}`}
          projectId={projectId}
          editable={editable}
          initialData={agentConfig}
          onSaved={handleSaved}
        />
        <SlackCard
          key={`slack-${configVersion}`}
          projectId={projectId}
          editable={editable}
          initialData={agentConfig}
          onSaved={handleSaved}
        />
        <WebhooksCard projectId={projectId} editable={editable} />
      </div>
    </TooltipProvider>
  );
}
