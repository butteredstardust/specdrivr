import { NextRequest, NextResponse } from 'next/server';
import { validateAgentToken, getUnauthorizedResponse } from '@/lib/auth';
import { CreateTestResultSchema, ApiResponseSchema } from '@/lib/schemas';
import { logTestResult } from '@/lib/agent-memory';
import { z } from 'zod';

/**
 * POST /api/agent/verify
 * Log test results for a task
 * Auth: Requires X-Agent-Token header
 */
export async function POST(request: NextRequest) {
  // Validate authentication
  if (!validateAgentToken(request)) {
    return getUnauthorizedResponse();
  }

  try {
    const body = await request.json();

    // Validate request body
    const parsedBody = CreateTestResultSchema.parse(body);

    // Log test result
    const resultId = await logTestResult(
      parsedBody.taskId,
      parsedBody.success,
      parsedBody.logs || ''
    );

    const response = {
      success: true,
      data: {
        resultId,
        taskId: parsedBody.taskId,
        success: parsedBody.success,
        message: parsedBody.success
          ? 'Tests passed successfully'
          : 'Tests failed - task blocked',
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in POST /api/agent/verify:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
