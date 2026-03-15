import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth, authInstance } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(12, 'New password must be at least 12 characters'),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors[0]?.message ?? 'Validation failed',
          },
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    const reqHeaders = await headers();

    await authInstance.api.changePassword({
      headers: reqHeaders,
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    // BetterAuth throws when the current password is wrong
    const message = error instanceof Error ? error.message : String(error);
    const isInvalidPassword =
      message.toLowerCase().includes('invalid') ||
      message.toLowerCase().includes('incorrect') ||
      message.toLowerCase().includes('password') ||
      message.toLowerCase().includes('credentials');

    if (isInvalidPassword) {
      return NextResponse.json(
        { error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' } },
        { status: 400 }
      );
    }

    return handleApiError(error);
  }
}
