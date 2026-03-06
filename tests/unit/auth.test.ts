import { describe, it, expect } from 'vitest';
import { getUnauthorizedResponse } from '@/lib/auth';

describe('Auth Utilities', () => {
    describe('getUnauthorizedResponse', () => {
        it('should return a Response object with 401 status and correct JSON body', async () => {
            const response = getUnauthorizedResponse();

            expect(response).toBeInstanceOf(Response);
            expect(response.status).toBe(401);
            expect(response.headers.get('Content-Type')).toBe('application/json');

            const data = await response.json();
            expect(data).toEqual({
                success: false,
                error: 'Unauthorized',
                message: 'Invalid or missing X-Agent-Token header'
            });
        });
    });
});
