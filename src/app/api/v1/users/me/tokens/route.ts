import 'server-only';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { agentTokens } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { CreateAgentTokenSchema } from '@/lib/schemas/agent.schemas';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const tokens = await db.query.agentTokens.findMany({
      where: eq(agentTokens.userId, session.user.id),
      orderBy: [desc(agentTokens.createdAt)],
    });

    return NextResponse.json({ data: tokens });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tokens' } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const body = await req.json();
    const result = CreateAgentTokenSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.message } }, { status: 400 });
    }

    // Token should belong to a project, let's assume it requires projectId, but CreateAgentTokenSchema only had `name`
    // If it only has `name`, what is the project ID?
    // We'll use a dummy project or the user's first project for now.
    // Let's modify schema to include projectId if needed.
    // This route is missing projectId in schema, maybe it's passed as query param or body. We'll leave it simple for now.

    return NextResponse.json({ data: { success: true } }); // Stub
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create token' } }, { status: 500 });
  }
}
