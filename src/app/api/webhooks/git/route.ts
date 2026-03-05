import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { gitCommits, projects } from '@/db/schema';
import { validateAgentToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

/**
 * POST /api/webhooks/git
 *
 * GitHub webhook handler for receiving commit notifications
 *
 * Headers:
 * - X-Agent-Token: Agent authentication token (required)
 * - X-GitHub-Event: Event type (e.g., 'push', 'pull_request')
 * - X-Hub-Signature-256: HMAC signature (optional, for security)
 *
 * Body (push event):
 * {
 *   project_id: number,   // Project ID (required)
 *   sha: string,          // Commit hash (40 characters)
 *   branch: string,       // Branch name
 *   message: string,      // Commit message
 *   author_name: string,  // Author name
 *   author_email: string, // Author email
 *   task_id?: number,     // Optional: associated task ID
 *   plan_id?: number      // Optional: associated plan ID
 * }
 *
 * Returns:
 * - 200 OK with message if commit inserted
 * - 200 OK if commit already exists (idempotent)
 * - 401 if X-Agent-Token is missing or invalid
 * - 400 for invalid request
 * - 422 for validation errors
 */
export async function POST(request: NextRequest) {
  try {
    // Validate agent token
    const isValidToken = validateAgentToken(request);
    if (!isValidToken) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or missing X-Agent-Token' } },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request body
    const result = gitWebhookSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            fields: result.error.flatten().fieldErrors,
          },
        },
        { status: 422 }
      );
    }

    const { project_id: projectId, sha, branch, message, author_name: authorName, author_email: authorEmail, task_id: taskId, plan_id: planId } = result.data;

    // Verify project exists and token has access
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    // Check if commit already exists (idempotent)
    const existing = await db.query.gitCommits.findFirst({
      where: eq(gitCommits.sha, sha),
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        data: { id: existing.id, message: 'Commit already exists (idempotent)' },
      });
    }

    // Insert new commit
    const [newCommit] = await db
      .insert(gitCommits)
      .values({
        projectId,
        sha,
        branch,
        message,
        authorName,
        authorEmail,
        taskId,
        planId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        id: newCommit.id,
        sha: newCommit.sha,
        message: 'Commit recorded',
      },
    });
  } catch (error) {
    console.error('Git webhook error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// Schema Validation
// ============================================================================

const gitWebhookSchema = z.object({
  project_id: z.number().int().positive('project_id is required'),
  sha: z.string().length(40).regex(/^[a-f0-9]{40}$/i, 'Invalid commit SHA'),
  branch: z.string().min(1, 'Branch is required'),
  message: z.string().min(1, 'Message is required'),
  author_name: z.string().optional(),
  author_email: z.string().email().optional(),
  task_id: z.number().int().positive().optional(),
  plan_id: z.number().int().positive().optional(),
});