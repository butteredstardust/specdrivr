import { db } from '@/db';
import { agentConfig, type AgentConfigSelect, type AgentConfigInsert } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { decryptCredential, encryptCredential } from '@/lib/credential-crypto';

const secretFields = [
  'githubToken',
  'githubWebhookSecret',
  'slackBotToken',
  'geminiApiKey',
  'claudeApiKey',
] as const;

type AgentConfigUpdate = Partial<
  Omit<AgentConfigInsert, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
>;

function encryptSecrets(data: AgentConfigUpdate): AgentConfigUpdate {
  const encrypted = { ...data };
  for (const field of secretFields) {
    if (field in encrypted) encrypted[field] = encryptCredential(encrypted[field]);
  }
  return encrypted;
}

function decryptSecrets(config: AgentConfigSelect): AgentConfigSelect {
  const decrypted = { ...config };
  for (const field of secretFields) decrypted[field] = decryptCredential(decrypted[field]) ?? null;
  return decrypted;
}

export class AgentConfigRepository extends BaseRepository {
  async getByProjectId(projectId: number): Promise<AgentConfigSelect | null> {
    const result = await this.executeQuery(() =>
      db.select().from(agentConfig).where(eq(agentConfig.projectId, projectId)).limit(1)
    );
    return result[0] ? decryptSecrets(result[0]) : null;
  }

  async upsertByProjectId(projectId: number, data: AgentConfigUpdate): Promise<AgentConfigSelect> {
    const encryptedData = encryptSecrets(data);
    const [result] = await this.executeQuery(() =>
      db
        .insert(agentConfig)
        .values({ projectId, ...encryptedData } as AgentConfigInsert)
        .onConflictDoUpdate({
          target: agentConfig.projectId,
          set: { ...encryptedData, updatedAt: new Date() },
        })
        .returning()
    );
    return decryptSecrets(result!);
  }
}

export const agentConfigRepository = new AgentConfigRepository();
