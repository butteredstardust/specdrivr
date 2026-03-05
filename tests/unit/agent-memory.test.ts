import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getNextTask, updateTaskStatus } from '@/lib/agent-memory';
import { db } from '@/db';

vi.mock('@/db', () => {
    const mockFluent = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve([])),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
    };

    (mockFluent.returning as any).mockImplementation(() => ({
        then: (resolve: any) => resolve([{ id: 1, status: 'done', updatedAt: new Date() }])
    }));

    return {
        db: {
            ...mockFluent,
            query: {
                tasks: {
                    findFirst: vi.fn()
                }
            }
        }
    };
});

describe('Agent Memory', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getNextTask', () => {
        it('should find the next available task for a specific project', async () => {
            (db.select() as any).then.mockImplementationOnce((resolve: any) => resolve([{
                tasks: { id: 1, status: 'todo', description: 'Test task' }
            }]));

            const task = await getNextTask(1);
            expect(db.select).toHaveBeenCalled();
            expect(task).toBeDefined();
            expect(task?.status).toBe('todo');
        });
    });

    describe('updateTaskStatus', () => {
        it('should update task status to done and handle timestamps', async () => {
            await updateTaskStatus(1, 'done');
            expect(db.update).toHaveBeenCalled();
            expect(db.set).toHaveBeenCalledWith(expect.objectContaining({
                status: 'done',
                updatedAt: expect.any(Date)
            }));
        });

        it('should update timestamp when moving status back from done', async () => {
            await updateTaskStatus(1, 'in_progress');
            expect(db.update).toHaveBeenCalled();
            expect(db.set).toHaveBeenCalledWith(expect.objectContaining({
                status: 'in_progress',
                updatedAt: expect.any(Date)
            }));
        });
    });
});
