import 'server-only';
import { db } from '@/db';
import { projectMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import type { UserRole } from '@/db/schema';

// Role hierarchy — higher index = more permissions
const ROLE_HIERARCHY: UserRole[] = ['viewer', 'member', 'admin', 'owner'];

export function roleAtLeast(userRole: UserRole, required: UserRole): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(required);
}

/**
 * Returns the user's role on a project, or null if not a member.
 */
export async function getProjectRole(
  userId: number,
  projectId: number
): Promise<UserRole | null> {
  const rows = await db
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.userId, userId),
        eq(projectMembers.projectId, projectId)
      )
    )
    .limit(1);

  return rows[0]?.role ?? null;
}

/**
 * Returns true if the user has at least the required role on the project.
 */
export async function canPerform(
  userId: number,
  projectId: number,
  required: UserRole
): Promise<boolean> {
  const role = await getProjectRole(userId, projectId);
  if (!role) return false;
  return roleAtLeast(role, required);
}

/**
 * Permission helpers — call these in route handlers.
 * All return { allowed: boolean, role: UserRole | null }
 */
export async function requireMember(userId: number, projectId: number) {
  const role = await getProjectRole(userId, projectId);
  return { allowed: role !== null, role };
}

export async function requireAdmin(userId: number, projectId: number) {
  const role = await getProjectRole(userId, projectId);
  return { allowed: role !== null && roleAtLeast(role, 'admin'), role };
}

export async function requireOwner(userId: number, projectId: number) {
  const role = await getProjectRole(userId, projectId);
  return { allowed: role === 'owner', role };
}

/**
 * Permission matrix — mirrors the spec table exactly.
 * Use these constants in route handlers for self-documenting checks.
 */
export const PERMISSIONS = {
  VIEW_SPECS:         'member'   as UserRole, // viewer+
  CREATE_EDIT_SPEC:   'member'   as UserRole,
  GENERATE_PLAN:      'member'   as UserRole,
  APPROVE_PLAN:       'admin'    as UserRole,
  REJECT_PLAN:        'admin'    as UserRole,
  REQUEST_CHANGES:    'admin'    as UserRole,
  CONTROL_SESSION:    'admin'    as UserRole,
  UNBLOCK_TASK:       'member'   as UserRole,
  OVERRIDE_TASK:      'admin'    as UserRole,
  INVITE_MEMBERS:     'admin'    as UserRole,
  CHANGE_ROLES:       'admin'    as UserRole,
  VIEW_AUDIT_LOG:     'admin'    as UserRole,
  EDIT_SETTINGS:      'admin'    as UserRole,
  MANAGE_INTEGRATIONS:'admin'    as UserRole,
  DELETE_PROJECT:     'owner'    as UserRole,
  TRANSFER_OWNERSHIP: 'owner'    as UserRole,
} as const;
