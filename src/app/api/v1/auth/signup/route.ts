import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authInstance } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const SignupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parsed.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    try {
      // 1. Call BetterAuth signUpEmail
      // This handles password hashing and autoSignIn
      const result = await authInstance.api.signUpEmail({
        body: {
          email,
          password,
          name,
        },
      });

      if (!result || !result.user) {
        throw new Error('Failed to create user account');
      }

      // 2. Post-signup logic: update onboardingStep
      await db.update(users).set({ onboardingStep: 1 }).where(eq(users.id, result.user.id));

      return NextResponse.json(
        {
          data: {
            user: {
              id: result.user.id,
              email: result.user.email,
              name: result.user.name,
            },
          },
        },
        { status: 201 }
      );
    } catch (error: unknown) {
      // BetterAuth throws error objects
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'USER_ALREADY_EXISTS'
      ) {
        return NextResponse.json(
          { error: { code: 'CONFLICT', message: 'Email already registered' } },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error: unknown) {
    logger.error(error, 'Signup error');
    return handleApiError(error);
  }
}
