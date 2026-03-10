import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authInstance } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { headers } from 'next/headers';

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message, details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    // Use Better Auth server-side API to create user
    // This handles password hashing, validation, and session creation if autoSignIn is enabled
    const result: any = await authInstance.api.signUpEmail({
      body: {
        email,
        password,
        name: name || email.split("@")[0],
      },
      headers: await headers()
    });

    return NextResponse.json(
      { success: true, data: { user: result.user, session: result.session || null } },
      { status: 201 }
    );
  } catch (error: any) {
    // Better Auth might throw specific errors (e.g. Email already exists)
    if (error.code === 'USER_ALREADY_EXISTS' || error.message?.includes('already exists')) {
        return NextResponse.json(
            { success: false, error: { code: 'CONFLICT', message: 'Email already exists' } },
            { status: 409 }
        );
    }
    return handleApiError(error);
  }
}
