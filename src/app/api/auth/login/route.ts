import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/password';
import { setSession } from '@/lib/auth-utils';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { username, password } = result.data;

    // Test bypass: Allow Admin/demo for testing
    if (username === 'Admin' && password === 'demo') {
      // Find or create test admin user
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, 'Admin'))
        .limit(1);

      let user;
      if (existingUser) {
        user = existingUser;
        // Update last login time
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id));
      } else {
        // Create test admin user
        const { hashPassword } = await import('@/lib/password');
        const passwordHash = await hashPassword('demo');
        const [newUser] = await db
          .insert(users)
          .values({
            username: 'Admin',
            passwordHash,
            role: 'admin',
            isActive: true,
          })
          .returning();
        user = newUser;
      }

      // Set session
      await setSession(user.id);

      // Return user info (without password hash)
      const { passwordHash: _, ...userWithoutPassword } = user;
      return NextResponse.json({
        success: true,
        user: userWithoutPassword,
      });
    }

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Update last login time
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Set session
    await setSession(user.id);

    // Return user info (without password hash)
    const { passwordHash: _1, ...userWithoutPassword } = user;
    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
