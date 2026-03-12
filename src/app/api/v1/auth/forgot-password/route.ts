import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authInstance } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

const ForgotPasswordSchema = z.object({
  email: z.string().email()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ForgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid email format', 
            details: parsed.error.errors 
          } 
        },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    try {
      // BetterAuth generates token and calls sendResetPassword callback
      await authInstance.api.requestPasswordReset({
        email
      });
      
      // Always return 200 to prevent email enumeration
      return NextResponse.json(
        { data: { success: true } },
        { status: 200 }
      );
    } catch (error) {
      // Log the error but still return 200 to the client
      logger.error({ error, email }, 'Error in forgot-password endpoint');
      return NextResponse.json(
        { data: { success: true } },
        { status: 200 }
      );
    }
  } catch (error: unknown) {
    logger.error(error, 'Forgot password request error');
    return handleApiError(error);
  }
}
