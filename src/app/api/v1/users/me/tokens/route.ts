import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { agentTokens } from '@/db/schema';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const createTokenSchema = z.object({
  name: z.string().min(1),
  projectId: z.number().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  try {
    const userId = parseInt(session.user.id);
    const tokens = await db.select({
      id: agentTokens.id,
      name: agentTokens.name,
      prefix: agentTokens.prefix,
      lastUsedAt: agentTokens.lastUsedAt,
      expiresAt: agentTokens.expiresAt,
      createdAt: agentTokens.createdAt,
    })
    .from(agentTokens)
    .where(eq(agentTokens.userId, userId));

    return NextResponse.json({ data: tokens });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, projectId } = createTokenSchema.parse(body);

    const token = `sdk_${randomBytes(24).toString('hex')}`;
    const prefix = token.slice(0, 10);
    const tokenHash = await bcrypt.hash(token, 12);

    const userId = parseInt(session.user.id);
    const [inserted] = await db.insert(agentTokens).values({
      userId: userId,
      projectId,
      name,
      tokenHash,
      prefix,
    }).returning();

    return NextResponse.json({ 
      data: { 
        id: inserted.id,
        name: inserted.name,
        token // Return full token ONCE
      } 
    });
  } catch (error) {
    return handleApiError(error);
  }
}
