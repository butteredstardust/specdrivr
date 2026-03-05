import { db } from '@/db';
import {
  projects,
  specifications,
  plans,
  tasks,
  testResults,
  agentLogs,
  type ProjectInsert,
  type ProjectSelect,
  type SpecificationInsert,
  type PlanInsert,
  type TaskInsert,
  type TaskSelect,
  type TestResultInsert,
  type AgentLogInsert,
  taskStatusEnum,
} from '@/db/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';

/**
 * Get the next available task for a project based on dependencies
 */
export async function getNextTask(projectId: number): Promise<TaskSelect | null> {
  try {
    // Get the first task where status is 'todo' and has no dependencies or dependencies are met
    // And ensure we are only matching tasks within the scope of our given projectId
    const nextTasks = await db
      .select()
      .from(tasks)
      .innerJoin(plans, eq(tasks.planId, plans.id))
      .innerJoin(specifications, eq(plans.specId, specifications.id))
      .innerJoin(projects, eq(specifications.projectId, projects.id))
      .where(
        and(
          eq(projects.id, projectId),
          eq(tasks.status, 'todo'),
          // Ensure dependency task is in a 'done' state OR null
          sql`${tasks.dependencyTaskId} IS NULL OR EXISTS (
            SELECT 1 FROM ${tasks} AS dt
            INNER JOIN ${plans} AS dp ON dt.plan_id = dp.id
            INNER JOIN ${specifications} AS ds ON dp.spec_id = ds.id
            WHERE dt.id = ${tasks.dependencyTaskId}
              AND dt.status = 'done'
              AND ds.project_id = ${projectId}
          )`
        )
      )
      .orderBy(tasks.priority, tasks.createdAt)
      .limit(1);

    if (nextTasks.length > 0) {
      return nextTasks[0].tasks;
    }

    return null;
  } catch (error) {
    console.error('Error getting next task:', error);
    throw error;
  }
}

/**
 * Get full project context including spec, plan, and current tasks
 */
export async function getProjectContext(
  projectId: number
): Promise<{
  project: ProjectSelect;
  specification: typeof specifications.$inferSelect | null;
  plan: typeof plans.$inferSelect | null;
  tasks: TaskSelect[];
}> {
  try {
    // Get project
    const project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (project.length === 0) {
      throw new Error(`Project with id ${projectId} not found`);
    }

    // Get active specification
    const spec = await db
      .select()
      .from(specifications)
      .where(and(eq(specifications.projectId, projectId), eq(specifications.isActive, true)))
      .limit(1);

    if (spec.length === 0) {
      return {
        project: project[0],
        specification: null,
        plan: null,
        tasks: [],
      };
    }

    // Get the plan for the specification
    const plan = await db.select().from(plans).where(eq(plans.specId, spec[0].id)).limit(1);

    // Get all tasks for the plan
    let taskList: TaskSelect[] = [];
    if (plan.length > 0) {
      taskList = await db
        .select()
        .from(tasks)
        .where(eq(tasks.planId, plan[0].id))
        .orderBy(tasks.priority, tasks.createdAt);
    }

    return {
      project: project[0],
      specification: spec[0],
      plan: plan[0] || null,
      tasks: taskList,
    };
  } catch (error) {
    console.error('Error getting project context:', error);
    throw error;
  }
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskId: number,
  status: typeof taskStatusEnum.enumValues[number]
): Promise<TaskSelect> {
  try {
    const [updatedTask] = await db
      .update(tasks)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning();

    if (!updatedTask) {
      throw new Error(`Task with id ${taskId} not found`);
    }

    // Log the status update
    await addAgentLog(taskId, 'info', `Task status updated to: ${status}`);

    return updatedTask;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}

/**
 * Log test result for a task
 */
export async function logTestResult(
  taskId: number,
  success: boolean,
  logs: string
): Promise<number> {
  try {
    const [result] = await db
      .insert(testResults)
      .values({
        taskId,
        success,
        logs,
      })
      .returning({ id: testResults.id });

    if (!result) {
      throw new Error('Failed to log test result');
    }

    // Also update the task status based on test result
    if (success) {
      await updateTaskStatus(taskId, 'done');
    } else {
      await addAgentLog(taskId, 'error', 'Task failed tests and is now blocked');
    }

    return result.id;
  } catch (error) {
    console.error('Error logging test result:', error);
    throw error;
  }
}

/**
 * Add agent log entry
 */
export async function addAgentLog(
  taskId: number,
  level: typeof agentLogs.level.enumValues[number],
  message: string
): Promise<number> {
  try {
    const [log] = await db
      .insert(agentLogs)
      .values({
        taskId,
        level,
        message,
      })
      .returning({ id: agentLogs.id });

    if (!log) {
      throw new Error('Failed to add agent log');
    }

    return log.id;
  } catch (error) {
    console.error('Error adding agent log:', error);
    throw error;
  }
}

/**
 * Get agent logs for a specific task
 */
export async function getAgentLogsForTask(
  taskId: number,
  limit: number = 100
): Promise<typeof agentLogs.$inferSelect[]> {
  try {
    const logs = await db
      .select()
      .from(agentLogs)
      .where(eq(agentLogs.taskId, taskId))
      .orderBy(desc(agentLogs.timestamp))
      .limit(limit);

    return logs;
  } catch (error) {
    console.error('Error getting agent logs:', error);
    throw error;
  }
}

/**
 * Get all tasks with specific status
 */
export async function getTasksByStatus(
  projectId: number,
  status: typeof taskStatusEnum.enumValues[number]
): Promise<TaskSelect[]> {
  try {
    const taskList = await db
      .select()
      .from(tasks)
      .innerJoin(plans, eq(tasks.planId, plans.id))
      .innerJoin(specifications, eq(plans.specId, specifications.id))
      .innerJoin(projects, eq(specifications.projectId, projects.id))
      .where(and(eq(projects.id, projectId), eq(tasks.status, status)))
      .orderBy(tasks.priority, tasks.createdAt);

    return taskList.map(t => t.tasks);
  } catch (error) {
    console.error('Error getting tasks by status:', error);
    throw error;
  }
}

/**
 * Create a new task
 */
export async function createTask(planId: number, taskData: {
  description?: string;
  filesInvolved?: string[];
  priority?: number;
  dependencyTaskId?: number | null;
}): Promise<TaskSelect> {
  try {
    const [task] = await db
      .insert(tasks)
      .values({
        planId,
        description: taskData.description || '',
        filesInvolved: taskData.filesInvolved || [],
        priority: taskData.priority || 1,
        dependencyTaskId: taskData.dependencyTaskId || null,
        status: 'todo',
      })
      .returning();

    if (!task) {
      throw new Error('Failed to create task');
    }

    await addAgentLog(task.id, 'info', 'Task created');

    return task;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}
