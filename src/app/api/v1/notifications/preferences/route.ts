import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { notificationRepository } from '@/repositories/notification-repository';
import { handleApiError } from '@/lib/error-handler';

const ALL_EVENT_TYPES = [
  'plan_generated',
  'plan_approved',
  'plan_rejected',
  'changes_requested',
  'session_complete',
  'task_blocked',
  'session_failed',
  'member_invited',
  'role_changed',
] as const;

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

interface PrefInput {
  eventType: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
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

    if (!body || !Array.isArray(body.preferences)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'preferences array is required' } },
        { status: 400 }
      );
    }

    const validEventTypes = new Set<string>(ALL_EVENT_TYPES);
    const validated: PrefInput[] = [];

    for (const pref of body.preferences as PrefInput[]) {
      if (!validEventTypes.has(pref.eventType)) {
        return NextResponse.json(
          { error: { code: 'BAD_REQUEST', message: `Unknown event type: ${pref.eventType}` } },
          { status: 400 }
        );
      }
      validated.push(pref);
    }

    await notificationRepository.upsertPreferences(session.user.id, validated);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
