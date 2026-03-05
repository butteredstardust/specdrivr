import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getSessionUser } from '@/lib/auth-utils';
import { hashPassword } from '@/lib/password';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Schema for creating a new user
const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username too long'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'developer', 'viewer']).default('viewer'),
  isActive: z.boolean().default(true),
  isAdmin: z.boolean().default(false),
});

// Schema for updating a user
const updateUserSchema = z.object({
  role: z.enum(['admin', 'developer', 'viewer']).optional(),
  isActive: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
});

/**
 * GET /api/admin/users - Get all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and admin
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Fetch all users, excluding passwordHash
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        avatarId: users.avatarId,
        isActive: users.isActive,
        isAdmin: users.isAdmin,
        role: users.role,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .orderBy(users.username);

    return NextResponse.json({
      success: true,
      users: allUsers,
    });

  } catch (error) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users - Create a new user (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and admin
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const result = createUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { username, password, role, isActive, isAdmin } = result.data;

    // Check if username already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        passwordHash,
        avatarId: 1, // Default avatar
        isActive,
        isAdmin,
        role,
      })
      .returning();

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    // Return new user data (without passwordHash)
    const { passwordHash: _passwordHash, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
