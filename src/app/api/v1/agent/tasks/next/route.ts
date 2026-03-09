import 'server-only';
import { NextResponse } from 'next/server';
import { db } from '@/db';

import { sql } from 'drizzle-orm';
import { requireAgentToken } from '@/lib/rbac';

export async function GET() {
  try {
    const authResult = await requireAgentToken();
    if ('error' in authResult) return authResult.error;

    // Use transaction to atomically find and claim task
    const claimedTask = await db.transaction(async (tx) => {
      // Find eligible task: status = 'todo' AND all tasks in dependsOn have status = 'done'
      // Note: In Postgres/Drizzle doing this query perfectly might require a subquery or raw SQL.
      // We will do a simplified raw query to guarantee atomicity.

      // Used for comment but previously threw unused expression
      // The sql variable was assigned but not used
      const queryFixed = sql`
        UPDATE tasks SET status = 'in_progress', updated_at = NOW()
        WHERE id = (
          SELECT t.id FROM tasks t
          JOIN plans p ON t.plan_id = p.id
          WHERE p.project_id = ${authResult.projectId}
            AND t.status = 'todo'
            AND (
              t.depends_on IS NULL OR array_length(t.depends_on, 1) IS NULL OR
              NOT EXISTS (
                SELECT 1 FROM unnest(t.depends_on) AS dep_ext_id
                JOIN tasks dep_t ON dep_t.external_id = dep_ext_id AND dep_t.plan_id = t.plan_id
                WHERE dep_t.status != 'done'
              )
            )
          ORDER BY t.sort_order ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING *
      `;

      // We have an issue here. plans table does NOT have project_id in our schema.
      // plans has `specId`, which belongs to `specifications` which has `projectId`.
      // Let's rewrite the query correctly.

      const queryFixed = sql`
        UPDATE tasks SET status = 'in_progress', updated_at = NOW()
        WHERE id = (
          SELECT t.id FROM tasks t
          JOIN plans p ON t.plan_id = p.id
          JOIN specifications s ON p.spec_id = s.id
          WHERE s.project_id = ${authResult.projectId}
            AND t.status = 'todo'
            AND (
              t.depends_on IS NULL OR array_length(t.depends_on, 1) IS NULL OR
              NOT EXISTS (
                SELECT 1 FROM unnest(t.depends_on) AS dep_ext_id
                JOIN tasks dep_t ON dep_t.external_id = dep_ext_id AND dep_t.plan_id = t.plan_id
                WHERE dep_t.status != 'done'
              )
            )
          ORDER BY t.sort_order ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING *
      `;

      const result = await tx.execute(queryFixed);
      return result[0];
    });

    if (!claimedTask) {
      return NextResponse.json({ data: null }); // No tasks available
    }

    return NextResponse.json({ data: claimedTask });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch next task' } }, { status: 500 });
  }
}
