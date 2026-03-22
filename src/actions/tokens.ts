'use server';

import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { tokenRepository } from '@/repositories/token-repository';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/rbac';
import { createAgentTokenSchema, revokeAgentTokenSchema } from '@/lib/schemas';

function generateSecureToken() {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const token = `sd_${randomBytes}`;
  const prefix = token.substring(0, 7);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  return { token, prefix, tokenHash };
}

export async function createAgentTokenAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = {
    projectId: Number(formData.get('projectId')),
    name: formData.get('name'),
  };

  const result = createAgentTokenSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const { allowed } = await requireAdmin(session.user.id, result.data.projectId);
  if (!allowed) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'You must be a project admin to create tokens' },
    };
  }

  try {
    const { token, prefix, tokenHash } = generateSecureToken();

    const created = await tokenRepository.create({
      projectId: result.data.projectId,
      userId: session.user.id,
      name: result.data.name,
      prefix,
      tokenHash,
    });

    revalidatePath(`/projects/${result.data.projectId}/settings`);

    return {
      success: true,
      data: {
        id: created.id,
        name: created.name,
        prefix: created.prefix,
        createdAt: created.createdAt,
      },
      // Ensure the plaintext token is only returned this one time
      plaintextToken: token,
    };
  } catch (error: unknown) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        userId: session.user.id,
        projectId: result.data.projectId,
      },
      'Failed to create agent token'
    );

    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    };
  }
}

export async function revokeAgentTokenAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const result = revokeAgentTokenSchema.safeParse({
    id: Number(formData.get('id')),
  });

  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  try {
    // Basic authorization: Verify the token belongs to the user
    // (A more thorough check would verify project admin rights, but user ownership is an acceptable minimum for revocation)
    const token = await tokenRepository.findByIdAndUserId(result.data.id, session.user.id);

    if (!token) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Token not found or does not belong to you' },
      };
    }

    await tokenRepository.revoke(result.data.id);

    // We do not have the project ID directly from the token fetch in standard schema without a join,
    // so we revalidate the general settings path. If needed, this could be customized.
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error: unknown) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        userId: session.user.id,
        tokenId: result.data.id,
      },
      'Failed to revoke agent token'
    );

    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    };
  }
}
