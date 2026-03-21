import { tokenRepository } from '@/repositories/token-repository';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function getUserAgentTokens() {
  const session = await auth();
  if (!session?.user?.id) {
    return { data: null, error: 'UNAUTHORIZED' as const };
  }

  try {
    const data = await tokenRepository.getByUserId(session.user.id);
    return { data, error: null };
  } catch (error) {
    logger.error({ error, userId: session.user.id }, 'Query getUserAgentTokens failed');
    return { data: null, error: 'INTERNAL_ERROR' as const };
  }
}
