import { z } from 'zod';

export const SessionQuerySchema = z.object({
  projectId: z.string().optional(),
  specId: z.string().optional(),
  status: z.enum(['running', 'paused', 'completed', 'failed', 'cancelled']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
