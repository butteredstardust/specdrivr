import { NextResponse } from 'next/server';
import { verifyAgentToken } from '@/lib/agent-auth';
import { agentSessionRepository } from '@/repositories/agent-session-repository';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';

const completeSchema = z.object({
  totalPromptTokens: z.number().int().nonnegative(),
  totalCompletionTokens: z.number().int().nonnegative(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await verifyAgentToken(request.headers.get('Authorization'));
  if (!authResult.success) {
    return authResult.response;
  }

  const { id } = await params;
  const sessionId = parseInt(id);

  try {
    const body = await request.json();
    const { totalPromptTokens, totalCompletionTokens } = completeSchema.parse(body);

    await agentSessionRepository.complete(sessionId, {
      totalPromptTokens,
      totalCompletionTokens,
    });

    return NextResponse.json({ data: { status: 'completed' } });
  } catch (error) {
    return handleApiError(error);
  }
}
