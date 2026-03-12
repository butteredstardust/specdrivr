'use server';

import { revalidatePath } from 'next/cache';
import { memberRepository } from '@/repositories/member-repository';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { inviteMemberSchema, updateMemberRoleSchema } from '@/lib/schemas';
import { requireAdmin, getProjectRole } from '@/lib/rbac';
import type { UserRole } from '@/db/schema';

export async function inviteMemberAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = {
    projectId: Number(formData.get('projectId')),
    email: formData.get('email'),
    role: formData.get('role'),
  };

  const result = inviteMemberSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const { allowed } = await requireAdmin(session.user.id, result.data.projectId);
  if (!allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'You must be a project admin to invite members' } };
  }

  try {
    const invite = await memberRepository.createInvite({
      projectId: result.data.projectId,
      email: result.data.email,
      role: result.data.role as UserRole,
      invitedBy: session.user.id,
    });
    
    revalidatePath(`/projects/${result.data.projectId}/settings`);
    
    return { success: true, data: invite };
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      userId: session.user.id,
      projectId: result.data.projectId
    }, 'Failed to create invite');
    
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } };
  }
}

export async function updateMemberRoleAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = {
    projectId: Number(formData.get('projectId')),
    userId: formData.get('userId'),
    role: formData.get('role'),
  };

  const result = updateMemberRoleSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const { allowed, role: actorRole } = await requireAdmin(session.user.id, result.data.projectId);
  if (!allowed || !actorRole) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'You must be a project admin to update roles' } };
  }

  // Get target user's current role
  const targetCurrentRole = await getProjectRole(result.data.userId, result.data.projectId);
  if (!targetCurrentRole) {
    return { success: false, error: { code: 'NOT_FOUND', message: 'Member not found in project' } };
  }

  // Guard: Cannot demote an Owner unless you are the owner
  if (targetCurrentRole === 'owner' && actorRole !== 'owner') {
    return { success: false, error: { code: 'FORBIDDEN', message: 'Only owners can modify other owners' } };
  }

  // Guard: Cannot escalate a user to Owner unless you are the owner
  if (result.data.role === 'owner' && actorRole !== 'owner') {
    return { success: false, error: { code: 'FORBIDDEN', message: 'Only owners can appoint new owners' } };
  }

  try {
    const updated = await memberRepository.updateRole(
      result.data.projectId,
      result.data.userId,
      result.data.role as UserRole,
      session.user.id
    );
    
    revalidatePath(`/projects/${result.data.projectId}/settings`);
    
    return { success: true, data: updated };
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      userId: session.user.id,
      targetUserId: result.data.userId
    }, 'Failed to update member role');
    
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } };
  }
}

export async function removeMemberAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const projectId = Number(formData.get('projectId'));
  const userId = formData.get('userId') as string;

  if (isNaN(projectId) || !userId) {
    return { success: false, error: { code: 'INVALID_INPUT', message: 'Project ID and User ID are required' } };
  }

  const { allowed } = await requireAdmin(session.user.id, projectId);
  if (!allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'You must be a project admin to remove members' } };
  }

  if (userId === session.user.id) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'You cannot remove yourself from the project' } };
  }

  try {
    await memberRepository.remove(projectId, userId, session.user.id);
    
    revalidatePath(`/projects/${projectId}/settings`);
    
    return { success: true };
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      userId: session.user.id,
      targetUserId: userId
    }, 'Failed to remove member');
    
    return { success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'An unexpected error occurred' } };
  }
}
