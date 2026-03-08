import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { NotFoundError, ValidationError, DatabaseError } from '@/lib/errors';

/**
 * Data required to create a new task
 * All fields are validated before insertion
 */
export interface CreateTaskData {
  description: string;
  planId?: number | null;
  status?: 'todo' | 'in_progress' | 'done' | 'blocked' | 'paused' | 'skipped';
  priority?: number;
  estimateHours?: number | null;
  verifyCommand?: string | null;
  doneCriteria?: string | null;
  recommendedModel?: string;
  createdByUserId?: number | null;
}

/**
 * Data for updating an existing task
 * All fields are optional - only provided fields will be updated
 */
export interface UpdateTaskData {
  description?: string;
  status?: 'todo' | 'in_progress' | 'done' | 'blocked' | 'paused' | 'skipped';
  priority?: number;
  estimateHours?: number | null;
  verifyCommand?: string | null;
  doneCriteria?: string | null;
  recommendedModel?: string;
  notes?: string | null;
  completedAt?: Date | null;
}

/**
 * Complete task object as returned from the database
 * Matches the schema structure with proper typing
 */
export interface Task {
  id: number;
  planId: number | null;
  status: 'todo' | 'in_progress' | 'done' | 'blocked' | 'paused' | 'skipped';
  description: string | null;
  filesInvolved: unknown;
  priority: number;
  dependencyTaskId: number | null;
  retryCount: number;
  notes: string | null;
  completedAt: Date | null;
  estimateHours: number | null;
  verifyCommand: string | null;
  doneCriteria: string | null;
  resumeContext: unknown;
  recommendedModel: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: number | null;
}

/**
 * TaskRepository encapsulates all database operations for the tasks table
 * Extends BaseRepository for consistent error handling and query execution
 *
 * Key patterns demonstrated:
 * - Strong typing with specific interfaces
 * - Business logic validation within methods
 * - Consistent error handling via execQuery
 * - Helper methods for common operations
 */
export class TaskRepository extends BaseRepository {
  /**
   * Get all tasks ordered by creation date (newest first)
   * @returns Array of all tasks
   */
  async getAll(): Promise<Task[]> {
    const result = await this.execQuery(() =>
      db.select().from(tasks).orderBy(desc(tasks.createdAt))
    );

    return result;
  }

  /**
   * Get a single task by ID
   * @param id - Task ID
   * @returns Task object or null if not found
   */
  async getById(id: number): Promise<Task | null> {
    const result = await this.execQuery(() =>
      db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
    );

    return result[0] || null;
  }

  /**
   * Get all tasks for a specific plan
   * @param planId - Plan ID
   * @returns Array of tasks ordered by priority and creation date
   */
  async getByPlanId(planId: number): Promise<Task[]> {
    const result = await this.execQuery(() =>
      db.select()
        .from(tasks)
        .where(eq(tasks.planId, planId))
        .orderBy(desc(tasks.priority), desc(tasks.createdAt))
    );

    return result;
  }

  /**
   * Get all tasks with a specific status
   * @param status - Task status enum
   * @returns Array of tasks
   */
  async getByStatus(
    status: 'todo' | 'in_progress' | 'done' | 'blocked' | 'paused' | 'skipped'
  ): Promise<Task[]> {
    const result = await this.execQuery(() =>
      db.select().from(tasks).where(eq(tasks.status, status)).orderBy(desc(tasks.createdAt))
    );

    return result;
  }

  /**
   * Create a new task
   * Validates all input data before insertion
   * @param data - Task creation data
   * @returns Created task
   * @throws ValidationError if validation fails
   * @throws DatabaseError if insertion fails
   */
  async create(data: CreateTaskData): Promise<Task> {
    // Validate required fields
    if (!data.description || data.description.trim().length === 0) {
      throw new ValidationError('Task description is required');
    }

    // Validate field length
    if (data.description.length > 5000) {
      throw new ValidationError('Task description cannot exceed 5000 characters');
    }

    // Validate priority range
    if (data.priority !== undefined) {
      if (data.priority < 1 || data.priority > 10) {
        throw new ValidationError('Priority must be between 1 and 10');
      }
    }

    // Validate estimate hours
    if (data.estimateHours !== undefined && data.estimateHours !== null) {
      if (data.estimateHours < 0) {
        throw new ValidationError('Estimate hours must be non-negative');
      }
    }

    // Prepare clean data with defaults
    const cleanData = {
      description: data.description.trim(),
      planId: data.planId ?? null,
      status: data.status ?? 'todo',
      priority: data.priority ?? 1,
      estimateHours: data.estimateHours ?? null,
      verifyCommand: data.verifyCommand ?? null,
      doneCriteria: data.doneCriteria ?? null,
      recommendedModel: data.recommendedModel ?? 'sonnet',
      createdByUserId: data.createdByUserId ?? null,
      retryCount: 0,
      notes: null,
      completedAt: null,
      // Default empty arrays/objects for JSONB fields
      filesInvolved: [],
      dependencyTaskId: null,
      resumeContext: null,
    };

    // Insert into database
    const [task] = await this.execQuery(() =>
      db.insert(tasks).values(cleanData).returning()
    );

    // Verify insertion succeeded
    if (!task) {
      throw new DatabaseError('Failed to create task');
    }

    return task;
  }

  /**
   * Update an existing task
   * Validates data and only updates provided fields
   * Automatically sets completedAt when status changes to 'done'
   * @param id - Task ID
   * @param data - Update data (all fields optional)
   * @returns Updated task
   * @throws NotFoundError if task not found
   * @throws ValidationError if validation fails
   * @throws DatabaseError if update fails
   */
  async update(id: number, data: UpdateTaskData): Promise<Task> {
    // Get existing task to verify it exists
    const existingTask = await this.getById(id);

    if (!existingTask) {
      throw new NotFoundError(`Task with ID ${id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};

    // Validate and add description if provided
    if (data.description !== undefined) {
      const trimmedDescription = data.description.trim();
      if (trimmedDescription.length === 0) {
        throw new ValidationError('Task description cannot be empty');
      }
      if (trimmedDescription.length > 5000) {
        throw new ValidationError('Task description cannot exceed 5000 characters');
      }
      updateData.description = trimmedDescription;
    }

    // Validate and add status if provided
    if (data.status !== undefined) {
      updateData.status = data.status;
      // Auto-set completedAt when status changes to 'done'
      if (data.status === 'done' && existingTask.status !== 'done') {
        updateData.completedAt = new Date();
      }
    }

    // Validate and add priority if provided
    if (data.priority !== undefined) {
      if (data.priority < 1 || data.priority > 10) {
        throw new ValidationError('Priority must be between 1 and 10');
      }
      updateData.priority = data.priority;
    }

    // Add optional fields if provided
    if (data.estimateHours !== undefined) {
      if (data.estimateHours !== null && data.estimateHours < 0) {
        throw new ValidationError('Estimate hours must be non-negative');
      }
      updateData.estimateHours = data.estimateHours;
    }

    if (data.verifyCommand !== undefined) updateData.verifyCommand = data.verifyCommand;
    if (data.doneCriteria !== undefined) updateData.doneCriteria = data.doneCriteria;
    if (data.recommendedModel !== undefined) updateData.recommendedModel = data.recommendedModel;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Ensure at least one field to update
    if (Object.keys(updateData).length === 0) {
      throw new ValidationError('No fields to update');
    }

    // Update updatedAt timestamp
    updateData.updatedAt = new Date();

    // Execute update
    const [updatedTask] = await this.execQuery(() =>
      db
        .update(tasks)
        .set(updateData)
        .where(eq(tasks.id, id))
        .returning()
    );

    // Verify update succeeded
    if (!updatedTask) {
      throw new DatabaseError('Failed to update task');
    }

    return updatedTask;
  }

  /**
   * Delete a task
   * @param id - Task ID
   * @throws NotFoundError if task not found
   */
  async delete(id: number): Promise<void> {
    // Verify task exists before deleting
    const task = await this.getById(id);

    if (!task) {
      throw new NotFoundError(`Task with ID ${id} not found`);
    }

    await this.execQuery(() =>
      db.delete(tasks).where(eq(tasks.id, id))
    );
  }

  /**
   * Mark a task as completed
   * Helper method for common operation
   * @param id - Task ID
   * @returns Updated task
   * @throws NotFoundError if task not found
   * @throws DatabaseError if update fails
   */
  async markAsCompleted(id: number): Promise<Task> {
    return this.update(id, {
      status: 'done',
      completedAt: new Date(),
    });
  }

  /**
   * Increment the retry count for a task
   * Helper method for task retry logic
   * @param id - Task ID
   * @returns Updated task
   * @throws NotFoundError if task not found
   * @throws DatabaseError if update fails
   */
  async incrementRetryCount(id: number): Promise<Task> {
    // Get existing task
    const task = await this.getById(id);

    if (!task) {
      throw new NotFoundError(`Task with ID ${id} not found`);
    }

    // Increment retry count
    const [updatedTask] = await this.execQuery(() =>
      db
        .update(tasks)
        .set({
          retryCount: task.retryCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, id))
        .returning()
    );

    if (!updatedTask) {
      throw new DatabaseError('Failed to update task');
    }

    return updatedTask;
  }
}

/**
 * Singleton instance of TaskRepository
 * Use this instance throughout the application
 */
export const taskRepository = new TaskRepository();
