import type { AgentConfigSelect } from '@/db/schema';

export type PublicAgentConfig = Omit<
  AgentConfigSelect,
  'githubToken' | 'githubWebhookSecret' | 'slackBotToken' | 'geminiApiKey' | 'claudeApiKey'
> & {
  githubTokenConfigured: boolean;
  githubWebhookSecretConfigured: boolean;
  slackBotTokenConfigured: boolean;
  geminiApiKeyConfigured: boolean;
  claudeApiKeyConfigured: boolean;
};

export function toPublicAgentConfig(config: AgentConfigSelect): PublicAgentConfig {
  const {
    githubToken,
    githubWebhookSecret,
    slackBotToken,
    geminiApiKey,
    claudeApiKey,
    ...publicFields
  } = config;

  return {
    ...publicFields,
    githubTokenConfigured: Boolean(githubToken),
    githubWebhookSecretConfigured: Boolean(githubWebhookSecret),
    slackBotTokenConfigured: Boolean(slackBotToken),
    geminiApiKeyConfigured: Boolean(geminiApiKey),
    claudeApiKeyConfigured: Boolean(claudeApiKey),
  };
}
