'use server';

import { db } from '@/db';
import { projects, specifications, plans, tasks, testResults, agentLogs } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq, desc, inArray } from 'drizzle-orm';

/**
 * Create a new project
 */
export async function createProject(projectData: {
  name: string;
  constitution?: string;
  techStack?: Record<string, unknown>;
  basePath?: string;
}) {
  try {
    const [newProject] = await db
      .insert(projects)
      .values({
        name: projectData.name,
        constitution: projectData.constitution || '',
        techStack: projectData.techStack || {},
        basePath: projectData.basePath || '',
      })
      .returning();

    if (!newProject) {
      throw new Error('Failed to create project');
    }

    revalidatePath('/projects');
    return { success: true, project: newProject };
  } catch (error) {
    console.error('Error creating project:', error);
    return { success: false, error: 'Failed to create project' };
  }
}

/**
 * Get all projects
 */
export async function getProjects() {
  try {
    const allProjects = await db.select().from(projects);
    return { success: true, projects: allProjects };
  } catch (error) {
    console.error('Error getting projects:', error);
    return { success: false, error: 'Failed to fetch projects' };
  }
}

/**
 * Update task status
 */
export async function updateTaskStatus(taskId: number, status: string) {
  try {
    const [updatedTask] = await db
      .update(tasks)
      .set({
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning();

    if (!updatedTask) {
      throw new Error('Task not found');
    }

    revalidatePath('/projects/[id]', 'page');
    return { success: true, task: updatedTask };
  } catch (error) {
    console.error('Error updating task status:', error);
    return { success: false, error: 'Failed to update task' };
  }
}

/**
 * Get agent logs with pagination
 */
export async function getAgentLogs(
  taskId?: number,
  page: number = 1,
  pageSize: number = 100
) {
  try {
    // This will be populated when we add logs table
    // For now, return empty
    return { success: true, logs: [], total: 0, page, pageSize };
  } catch (error) {
    console.error('Error getting agent logs:', error);
    return { success: false, error: 'Failed to fetch logs' };
  }
}

/**
 * Get project by ID with full context
 */
export async function getProjectById(projectId: number) {
  try {
    const { getProjectContext } = await import('@/lib/agent-memory');
    const context = await getProjectContext(projectId);

    return { success: true, context };
  } catch (error) {
    console.error('Error getting project:', error);
    return { success: false, error: 'Failed to fetch project' };
  }
}

/**
 * Get all specifications for a project (for version history)
 */
export async function getProjectSpecs(projectId: number) {
  try {
    const allSpecs = await db
      .select()
      .from(specifications)
      .where(eq(specifications.projectId, projectId))
      .orderBy(desc(specifications.createdAt));

    return { success: true, specs: allSpecs };
  } catch (error) {
    console.error('Error getting project specs:', error);
    return { success: false, error: 'Failed to fetch specifications' };
  }
}

/**
 * Create a new task (developer-facing)
 */
export async function createTaskDev(taskData: {
  planId: number;
  description?: string;
  filesInvolved?: string[];
  priority?: number;
  dependencyTaskId?: number | null;
}) {
  try {
    // Import the createTask helper from agent-memory
    const { createTask } = await import('@/lib/agent-memory');

    // Create the task using the existing helper
    const task = await createTask(taskData.planId, {
      description: taskData.description,
      filesInvolved: taskData.filesInvolved,
      priority: taskData.priority,
      dependencyTaskId: taskData.dependencyTaskId,
    });

    // Revalidate the project page to show the new task
    revalidatePath('/projects/[id]', 'page');
    return { success: true, task };
  } catch (error) {
    console.error('Error creating task:', error);
    return { success: false, error: 'Failed to create task' };
  }
}

/**
 * Update specification with versioning (developer-facing)
 * Creates new version and marks old as inactive
 */
export async function updateSpecificationDev(
  specId: number,
  content: string
) {
  try {
    if (!content.trim()) {
      throw new Error('Content cannot be empty');
    }

    // Get existing specification
    const [oldSpec] = await db
      .select()
      .from(specifications)
      .where(eq(specifications.id, specId))
      .limit(1);

    if (!oldSpec) {
      throw new Error('Specification not found');
    }

    // Parse version and increment
    const versionParts = oldSpec.version.split('.');
    const majorVersion = parseInt(versionParts[0]);
    const minorVersion = parseInt(versionParts[1] || '0');
    const newVersion = `${majorVersion}.${minorVersion + 1}`;

    // Mark old specification as inactive
    await db
      .update(specifications)
      .set({ isActive: false })
      .where(eq(specifications.id, specId));

    // Create new specification version
    const [newSpec] = await db
      .insert(specifications)
      .values({
        projectId: oldSpec.projectId,
        content: content.trim(),
        version: newVersion,
        isActive: true,
      })
      .returning();

    // Revalidate the project page
    revalidatePath('/projects/[id]', 'page');

    return { success: true, spec: newSpec };
  } catch (error) {
    console.error('Error updating specification:', error);
    return { success: false, error: 'Failed to update specification' };
  }
}

/**
 * Update project constitution (developer-facing)
 */
export async function updateConstitutionDev(
  projectId: number,
  constitution: string
) {
  try {
    // Update the project constitution
    await db
      .update(projects)
      .set({
        constitution: constitution.trim(),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    // Revalidate the project page
    revalidatePath('/projects/[id]', 'page');

    return { success: true };
  } catch (error) {
    console.error('Error updating constitution:', error);
    return { success: false, error: 'Failed to update constitution' };
  }
}

/**
 * Update project tech stack (developer-facing)
 */
export async function updateTechStackDev(
  projectId: number,
  techStack: Record<string, unknown>
) {
  try {
    // Update the project tech stack
    await db
      .update(projects)
      .set({
        techStack: techStack,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    // Revalidate the project page
    revalidatePath('/projects/[id]', 'page');

    return { success: true };
  } catch (error) {
    console.error('Error updating tech stack:', error);
    return { success: false, error: 'Failed to update tech stack' };
  }
}

/**
 * Create a new plan (developer-facing)
 */
export async function createPlanDev(planData: {
  specId: number;
  architectureDecisions?: Record<string, unknown>;
  status?: 'draft' | 'active' | 'completed' | 'archived';
}) {
  try {
    if (!planData.specId) {
      throw new Error('specId is required');
    }

    const [newPlan] = await db
      .insert(plans)
      .values({
        specId: planData.specId,
        architectureDecisions: planData.architectureDecisions || {},
        status: planData.status || 'draft',
      })
      .returning();

    if (!newPlan) {
      throw new Error('Failed to create plan');
    }

    // Revalidate the project page
    revalidatePath('/projects/[id]', 'page');

    return { success: true, plan: newPlan };
  } catch (error) {
    console.error('Error creating plan:', error);
    return { success: false, error: 'Failed to create plan' };
  }
}

/**
 * Update an existing plan (developer-facing)
 */
export async function updatePlanDev(
  planId: number,
  architectureDecisions: Record<string, unknown>,
  status?: 'draft' | 'active' | 'completed' | 'archived'
) {
  try {
    const [updatedPlan] = await db
      .update(plans)
      .set({
        architectureDecisions,
        ...(status && { status }),
      })
      .where(eq(plans.id, planId))
      .returning();

    if (!updatedPlan) {
      throw new Error('Plan not found');
    }

    // Revalidate the project page
    revalidatePath('/projects/[id]', 'page');

    return { success: true, plan: updatedPlan };
  } catch (error) {
    console.error('Error updating plan:', error);
    return { success: false, error: 'Failed to update plan' };
  }
}

/**
 * Log test result (developer-facing)
 */
export async function logTestResultDev(testData: {
  taskId: number;
  success: boolean;
  logs?: string;
}) {
  try {
    const { logTestResult } = await import('@/lib/agent-memory');
    const resultId = await logTestResult(
      testData.taskId,
      testData.success,
      testData.logs || ''
    );

    // Revalidate the project page
    revalidatePath('/projects/[id]', 'page');

    return { success: true, resultId };
  } catch (error) {
    console.error('Error logging test result:', error);
    return { success: false, error: 'Failed to log test result' };
  }
}

/**
 * Get test results for a project (developer-facing)
 */
export async function getProjectTestResults(projectId: number) {
  try {
    // First, get all task IDs for this project
    const projectTasks = await db
      .select({ id: tasks.id })
      .from(tasks)
      .innerJoin(plans, eq(tasks.planId, plans.id))
      .innerJoin(specifications, eq(plans.specId, specifications.id))
      .where(eq(specifications.projectId, projectId));

    const taskIds = projectTasks.map(t => t.id);

    if (taskIds.length === 0) {
      return { success: true, testResults: [] };
    }

    // Get test results for these tasks
    const results = await db
      .select()
      .from(testResults)
      .where(inArray(testResults.taskId, taskIds))
      .orderBy(desc(testResults.timestamp));

    return { success: true, testResults: results };
  } catch (error) {
    console.error('Error getting test results:', error);
    return { success: false, error: 'Failed to fetch test results' };
  }
}

/**
 * Add agent log (developer-facing)
 */
export async function addAgentLogDev(logData: {
  taskId: number;
  level?: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;

}) {
  try {
    const { addAgentLog } = await import('@/lib/agent-memory');
    const logId = await addAgentLog(
      logData.taskId,
      logData.level || 'info',
      logData.message
    );

    // Revalidate the project page
    revalidatePath('/projects/[id]', 'page');

    return { success: true, logId };
  } catch (error) {
    console.error('Error adding agent log:', error);
    return { success: false, error: 'Failed to add log' };
  }
}

/**
 * Get agent logs for a project (developer-facing)
 */
export async function getProjectAgentLogs(projectId: number, limit: number = 50) {
  try {
    const logs = await db
      .select()
      .from(agentLogs)
      .where(eq(agentLogs.projectId, projectId))
      .orderBy(desc(agentLogs.timestamp))
      .limit(limit);

    return { success: true, logs };
  } catch (error) {
    console.error('Error getting agent logs:', error);
    return { success: false, error: 'Failed to fetch logs' };
  }
}
