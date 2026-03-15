import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { userRepository } from '@/repositories';
import { handleApiError } from '@/lib/error-handler';

const UpdateMeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  onboardingStep: z.number().int().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  theme: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  try {
    const userId = session.user.id;
    const user = await userRepository.getById(userId);
    return NextResponse.json({ data: user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = UpdateMeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
        { status: 400 }
      );
    }
    const userId = session.user.id;
    const updated = await userRepository.update(userId, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
