import { z } from 'zod';

/**
 * Parses URL search parameters from a Request or URL using a Zod schema.
 */
export function parseUrlParams<T extends z.ZodTypeAny>(req: Request | URL, schema: T): z.infer<T> {
  const url = req instanceof URL ? req : new URL(req.url);
  return schema.parse(Object.fromEntries(url.searchParams.entries()));
}

/**
 * Safely parses URL search parameters from a Request or URL using a Zod schema.
 */
export function safeParseUrlParams<T extends z.ZodTypeAny>(
  req: Request | URL,
  schema: T
): z.SafeParseReturnType<z.input<T>, z.infer<T>> {
  const url = req instanceof URL ? req : new URL(req.url);
  return schema.safeParse(Object.fromEntries(url.searchParams.entries()));
}
