import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { notificationRepository } from '@/repositories/notification-repository';
import { handleApiError } from '@/lib/error-handler';

const EventTypeEnum = z.enum([
  'plan_generated',
  'plan_approved',
  'plan_rejected',
  'changes_requested',
  'session_complete',
  'task_blocked',
  'session_failed',
  'member_invited',
  'role_changed',
]);

const PreferencesSchema = z.object({
  preferences: z.array(
    z.object({
      eventType: EventTypeEnum,
      emailEnabled: z.boolean(),
      inAppEnabled: z.boolean(),
    })
  ),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const result = await notificationRepository.getPreferences(session.user.id);
    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = PreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: parsed.error.message } },
        { status: 400 }
      );
    }

    await notificationRepository.upsertPreferences(session.user.id, parsed.data.preferences);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
