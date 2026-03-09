// Environment configuration for standalone scripts
// Use this instead of @/lib/env in Node.js scripts
import { parseEnv } from './env-core';

export const env = parseEnv();
