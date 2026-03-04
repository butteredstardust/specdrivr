'use server';

import { db } from '@/db';
import { projects, specifications, plans, tasks } from '@/db/schema';
import { revalidatePath } from 'next/cache';

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
      .returning({ id: projects.id, name: projects.name });

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
 * Get tasks for a project
 */
export async function getProjectTasks(projectId: number) {
  try {
    const projectTasks = await db.query.projects.findMany({
      where: (projects, { eq }) => eq(projects.id, projectId),
      with: {
        specifications: {
          where: (specs, { eq }) => eq(specs.isActive, true),
          with: {
            plans: {
              with: {
                tasks: true,
              },
            },
          },
        },
      },
    });

    if (projectTasks.length === 0) {
      return { success: false, error: 'Project not found' };
    }

    const allTasks = projectTasks
      .flatMap((p) => p.specifications)
      .flatMap((s) => s.plans)
      .flatMap((pl) => pl.tasks);

    return { success: true, tasks: allTasks };
  } catch (error) {
    console.error('Error getting project tasks:', error);
    return { success: false, error: 'Failed to fetch tasks' };
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
        status,
        updatedAt: new Date(),
      })
      .where(tasks.id.equals(taskId))
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
