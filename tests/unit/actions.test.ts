import { describe, test, expect, beforeEach, vi } from 'vitest';
import { getAgentLogs, updateProjectDetailsDev, createPlanDev } from '@/lib/actions';
import { db } from '@/db';

// Mock the db and auth session
vi.mock('@/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 1 }]),
    }
}));

vi.mock('@/lib/auth-utils', () => ({
    getSessionUser: vi.fn().mockResolvedValue({ id: 1, role: 'developer' })
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}));

describe('Server Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('updateProjectDetailsDev', () => {
        test('should update project details if authenticated user exists', async () => {
            const result = await updateProjectDetailsDev(1, { name: 'New Name' });
            expect(result.success).toBe(true);
            expect(db.update).toHaveBeenCalled();
            expect(db.set).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Name' }));
        });
    });

    describe('createPlanDev', () => {
        test('should successfully create a plan with intent', async () => {
            const planData = {
                specId: 1,
                intent: 'Test implementation intent',
                architectureDecisions: {
                    frontend: 'React'
                }
            };

            const result = await createPlanDev(planData);

            expect(result.success).toBe(true);
            expect(db.insert).toHaveBeenCalled();
            // Check that values was called with intent
            expect(db.values).toHaveBeenCalledWith(expect.objectContaining({
                intent: 'Test implementation intent',
                specId: 1
            }));
        });
    });

    describe('getAgentLogs', () => {
        test('should return success for valid query', async () => {
            const result = await getAgentLogs({ projectId: 1, limit: 10 });
            expect(result.success).toBe(true);
            expect(result.logs).toBeDefined();
        });
    });
});
