import fs from 'fs';

// Fix 1: src/proxy.ts property ip
let proxyContent = fs.readFileSync('src/proxy.ts', 'utf-8');
proxyContent = proxyContent.replace(
  "const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';",
  "const ip = (request as any).ip || request.headers.get('x-forwarded-for') || '127.0.0.1';"
);

// Fix 2: src/proxy.ts Upstash redis typing
proxyContent = proxyContent.replace(
  "import { redis } from '@/lib/redis';",
  "import { redis } from '@/lib/redis';\nimport { Redis } from '@upstash/redis';"
);
proxyContent = proxyContent.replace(
  "  redis,",
  "  redis: redis as any,"
);
fs.writeFileSync('src/proxy.ts', proxyContent);

// Fix 3: src/lib/auth.ts Upstash redis typing and jwt token typing
let authContent = fs.readFileSync('src/lib/auth.ts', 'utf-8');
authContent = authContent.replace(
  "adapter: UpstashRedisAdapter(redis),",
  "adapter: UpstashRedisAdapter(redis as any),"
);
authContent = authContent.replace(
  "session.user.id = token.id as string;",
  "session.user.id = (token.id as string) || '';"
);
fs.writeFileSync('src/lib/auth.ts', authContent);

// Fix 4: src/repositories/project-repository.ts insert missing properties
let projectRepoContent = fs.readFileSync('src/repositories/project-repository.ts', 'utf-8');
projectRepoContent = projectRepoContent.replace(
  "    const cleanData = {\n      name: data.name.trim(),\n      description: data.description ?? null,\n      createdByUserId: data.createdByUserId || null,\n      status: 'active' as const,\n    };",
  "    const slugBase = data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');\n    const cleanData = {\n      name: data.name.trim(),\n      slug: `${slugBase}-${Date.now()}`,\n      description: data.description ?? null,\n      createdByUserId: data.createdByUserId || null,\n      status: 'active' as const,\n    };"
);
fs.writeFileSync('src/repositories/project-repository.ts', projectRepoContent);
