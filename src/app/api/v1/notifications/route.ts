import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { notificationRepository } from '@/repositories/notification-repository';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';
import { parseUrlParams } from '@/lib/api-utils';

const NotificationQuerySchema = z.object({
  projectId: z.coerce.number().int().positive().optional(),
  unreadOnly: z.preprocess((val) => val === 'true', z.boolean()).default(false),
  type: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(50),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  try {
    const query = parseUrlParams(request, NotificationQuerySchema);

    const { notifications, total, unreadCount } = await notificationRepository.getByUserId(
      session.user.id,
      {
        projectId: query.projectId,
        unreadOnly: query.unreadOnly,
        type: query.type,
        limit: query.limit,
        offset: (query.page - 1) * query.limit,
      }
    );

    return NextResponse.json({
      data: {
        notifications,
        unreadCount,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_QUERY',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}
