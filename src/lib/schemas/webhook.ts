import { z } from 'zod';

export const webhookFormSchema = z.object({
  url: z.string().url({ message: 'Invalid URL' }),
  secret: z.string().optional(),
  events: z.array(z.string()).min(1, 'At least one event must be selected'),
});
