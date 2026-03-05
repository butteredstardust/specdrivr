import { getAgentLogs, updateProjectDetailsDev } from '@/lib/actions';

// Mock the db and auth session to isolate action tests
jest.mock('@/db', () => ({
    db: {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
    }
}));

jest.mock('@/lib/auth-utils', () => ({
    getSessionUser: jest.fn().mockResolvedValue({ id: 1, role: 'developer' })
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn()
}));

describe('Server Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('updateProjectDetailsDev', () => {
        it('should update project details if authenticated user exists', async () => {
            const { db } = require('@/db');

            const result = await updateProjectDetailsDev(1, { name: 'New Name' });

            expect(result.success).toBe(true);
            expect(db.update).toHaveBeenCalled();
            expect(db.set).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Name' }));
        });
    });

    describe('getAgentLogs', () => {
        it('should structure db query correctly for filtering logs', async () => {
            // Because we mock the chain, we just test that it runs without throwing
            const result = await getAgentLogs({ projectId: 1, limit: 10 });
            expect(result.success).toBe(true);
            expect(result.logs).toBeDefined();
        });
    });
});
