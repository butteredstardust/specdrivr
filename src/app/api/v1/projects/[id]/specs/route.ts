import 'server-only';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { specifications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireRole } from '@/lib/rbac';
import { PaginationSchema } from '@/lib/schemas/shared.schemas';
import { z } from 'zod';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const authResult = await requireRole(id, 'viewer');
    if ('error' in authResult) return authResult.error;

    const url = new URL(req.url);
    const query = PaginationSchema.safeParse(Object.fromEntries(url.searchParams));

    if (!query.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: query.error.message } }, { status: 400 });
    }

    const items = await db.query.specifications.findMany({
      where: eq(specifications.projectId, id),
      limit: query.data.limit,
      offset: query.data.offset,
      orderBy: [desc(specifications.createdAt)],
    });

    const allSpecs = await db.query.specifications.findMany({
      where: eq(specifications.projectId, id)
    });

    const counts = { draft: 0, review: 0, running: 0, done: 0, stalled: 0 };
    for (const s of allSpecs) {
      if (s.status in counts) {
        counts[s.status as keyof typeof counts]++;
      }
    }

    return NextResponse.json({
      data: items,
      meta: {
        counts
      }
    });
  } catch (error) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch specifications' } }, { status: 500 });
  }
}
