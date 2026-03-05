import { getNextTask, updateTaskStatus } from '@/lib/agent-memory';

jest.mock('@/db', () => ({
    db: {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        query: {
            tasks: {
                findFirst: jest.fn()
            }
        }
    }
}));

describe('Agent Memory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getNextTask', () => {
        it('should find the next available task for a specific project', async () => {
            const { db } = require('@/db');

            // Mock db response
            db.query.tasks.findFirst.mockResolvedValueOnce({
                id: 1,
                planId: 1,
                status: 'todo',
                description: 'Test task'
            });

            const task = await getNextTask(1);

            expect(db.query.tasks.findFirst).toHaveBeenCalled();
            expect(task).toBeDefined();
            expect(task?.status).toBe('todo');
        });

        it('should return null if no task is available', async () => {
            const { db } = require('@/db');
            db.query.tasks.findFirst.mockResolvedValueOnce(undefined);

            const task = await getNextTask(1);

            expect(task).toBeNull();
        });
    });

    describe('updateTaskStatus', () => {
        it('should update task status to done and handle completion time', async () => {
            const { db } = require('@/db');

            await updateTaskStatus(1, 'done');

            expect(db.update).toHaveBeenCalled();
            expect(db.set).toHaveBeenCalledWith(expect.objectContaining({
                status: 'done',
                completedAt: expect.any(Date)
            }));
        });

        it('should unset completion time when moving status back from done', async () => {
            const { db } = require('@/db');

            await updateTaskStatus(1, 'in_progress');

            expect(db.update).toHaveBeenCalled();
            expect(db.set).toHaveBeenCalledWith(expect.objectContaining({
                status: 'in_progress',
                completedAt: null
            }));
        });
    });
});
