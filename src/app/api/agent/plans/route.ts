import { NextRequest, NextResponse } from 'next/server';
import { validateAgentToken, getUnauthorizedResponse } from '@/lib/auth';
import { CreatePlanSchema, ApiResponseSchema } from '@/lib/schemas';
import { db } from '@/db';
import { plans, PlanInsert } from '@/db/schema';
import { addAgentLog } from '@/lib/agent-memory';
/**
 * POST /api/agent/plans
 * Create a new plan for a specification
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
    const parsedBody = CreatePlanSchema.parse(body);

    // Insert plan into database
    const [newPlan] = await db
      .insert(plans)
      .values({
        specId: parsedBody.specId,
        architectureDecisions: parsedBody.architectureDecisions || {},
        status: parsedBody.status || 'draft',
      } as PlanInsert)
      .returning({
        id: plans.id,
        status: plans.status,
      });

    if (!newPlan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create plan',
        },
        { status: 500 }
      );
    }

    // Log the plan creation
    await addAgentLog(
      newPlan.id, // Using plan id as a special marker for system events
      'info',
      `Plan created for specification ${parsedBody.specId}`
    );

    const response = {
      success: true,
      data: {
        planId: newPlan.id,
        status: newPlan.status,
        message: 'Plan created successfully',
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in POST /api/agent/plans:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
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
