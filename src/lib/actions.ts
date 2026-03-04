'use server';

import { db } from '@/db';
import { projects, specifications, plans, tasks } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

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
