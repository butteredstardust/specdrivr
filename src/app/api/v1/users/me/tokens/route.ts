import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { tokenRepository } from '@/repositories/token-repository';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const createTokenSchema = z.object({
  name: z.string().min(1),
  projectId: z.number().optional(),
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
    const tokens = await tokenRepository.getByUserId(session.user.id);
    return NextResponse.json({ data: tokens });
  } catch (error) {
    return handleApiError(error);
  }
}

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
    const { name, projectId } = createTokenSchema.parse(body);

    const token = `sdk_${randomBytes(24).toString('hex')}`;
    const prefix = token.slice(0, 10);
    const tokenHash = await bcrypt.hash(token, 12);

    const inserted = await tokenRepository.create({
      userId: session.user.id,
      projectId,
      name,
      tokenHash,
      prefix,
    });

    return NextResponse.json({
      data: {
        id: inserted.id,
        name: inserted.name,
        token, // Return full token ONCE
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
