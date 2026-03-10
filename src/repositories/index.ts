/**
 * Repository Index
 *
 * Centralized exports for all repositories.
 * This file serves as a single import point for all data access logic.
 *
 * Benefits:
 * - Single source of truth for repository imports
 * - Easy to see all available repositories
 * - Simplifies import statements throughout the application
 * - Makes refactoring easier (only update imports in one place)
 *
 * Usage:
 * import { taskRepository, projectRepository } from '@/repositories';
 */

export { taskRepository, TaskRepository } from './task-repository';
export { projectRepository, ProjectRepository } from './project-repository';
export { userRepository, UserRepository } from './user-repository';
export { BaseRepository } from './base-repository';

/**
 * For new repositories:
 * 1. Create your repository file (e.g., specification-repository.ts)
 * 2. Add export here:
 *    export { specificationRepository, SpecificationRepository } from './specification-repository';
 */
