import { cookies } from 'next/headers';
import { UserSelect } from '@/db/schema';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'specdrivr_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Set the user session cookie
 */
export async function setSession(userId: number) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, userId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Get the current session user
 */
export async function getSessionUser(): Promise<UserSelect | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  try {
    const userId = parseInt(sessionCookie.value);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting session user:', error);
    return null;
  }
}

/**
 * Clear the user session
 */
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Auto-login for development: Ensure Admin user exists and return it
 */
export async function ensureAdminUser(): Promise<UserSelect> {
  // Check if Admin user already exists
  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.username, 'Admin'))
    .limit(1);

  if (existingAdmin) {
    // Update last login time
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, existingAdmin.id));

    return existingAdmin;
  }

  // Create Admin user
  const { hashPassword } = await import('./password');
  const passwordHash = await hashPassword('admin');

  const [adminUser] = await db
    .insert(users)
    .values({
      username: 'Admin',
      passwordHash,
      avatarId: 1,
      isActive: true,
      isAdmin: true,
      role: 'admin',
      lastLoginAt: new Date(),
    })
    .returning();

  return adminUser;
}

/**
 * Auto-login: Create session for Admin user in development
 */
export async function autoLogin(): Promise<UserSelect | null> {
  // Only auto-login in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Check if already logged in
  const existingSession = await getSessionUser();
  if (existingSession) {
    return existingSession;
  }

  // Ensure Admin user exists and create session
  const adminUser = await ensureAdminUser();
  await setSession(adminUser.id);

  return adminUser;
}
