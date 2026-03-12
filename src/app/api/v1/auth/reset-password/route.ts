import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authInstance } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid inputs', 
            details: parsed.error.errors 
          } 
        },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    try {
      await authInstance.api.resetPassword({
        body: {
          token,
          newPassword: password,
        }
      });
      
      return NextResponse.json(
        { data: { success: true } },
        { status: 200 }
      );
    } catch (error: unknown) {
      // BetterAuth throws token invalid or expired error
      if (error && typeof error === 'object' && 'code' in error && (error.code === 'INVALID_TOKEN' || error.code === 'EXPIRED_TOKEN')) {
        return NextResponse.json(
          { error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired' } },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error: unknown) {
    logger.error(error, 'Reset password error');
    return handleApiError(error);
  }
}
