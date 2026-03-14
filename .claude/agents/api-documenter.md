# API Documenter Agent

**Purpose:** Generate and maintain OpenAPI 3.1 specification from your 44+ API routes.

**Invocation:** User-triggered (on route changes)

**Output:** `openapi.json` (can be published to Swagger UI, Redoc, etc.)

## How to Use

### From CLI
```bash
claude agent api-documenter "Generate OpenAPI spec from src/app/api"
claude agent api-documenter "Update docs for new auth endpoints"
claude agent api-documenter "Generate client SDK documentation"
```

### Periodic Updates
Run after adding new API routes:
```bash
# After git commit:
git add src/app/api/v1/your-endpoint/route.ts
git commit -m "api: add new endpoint"
claude agent api-documenter "Update API docs"
git add openapi.json
git commit -m "docs: update OpenAPI spec"
```

## What It Does

### 1. Traverse Route Handlers
Scans all files in `src/app/api/` and identifies:

```
src/app/api/v1/projects/route.ts          → GET /api/v1/projects
src/app/api/v1/projects/[id]/route.ts     → GET /api/v1/projects/:id
src/app/api/v1/tasks/[id]/attempts/route.ts → POST /api/v1/tasks/:id/attempts
```

### 2. Extract OpenAPI Metadata

From each route handler, extracts:
```typescript
// Example: src/app/api/v1/projects/route.ts

/**
 * @openapi
 * /api/v1/projects:
 *   get:
 *     summary: "List all projects"
 *     description: "Returns paginated list of projects for authenticated user"
 *     tags:
 *       - Projects
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema: { type: integer, default: 50 }
 *       - name: offset
 *         in: query
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: "Success"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ProjectList"
 *       401:
 *         description: "Unauthorized"
 */
export async function GET(request: NextRequest) { ... }

/**
 * @openapi
 * /api/v1/projects:
 *   post:
 *     summary: "Create project"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateProjectInput"
 *     responses:
 *       201:
 *         description: "Created"
 */
export async function POST(request: NextRequest) { ... }
```

### 3. Generate OpenAPI Schema

Creates `openapi.json` with:
- Full endpoint list
- Request/response schemas
- Authentication requirements
- Error codes
- Example values

### 4. Validate Consistency

Checks that:
- ✓ Schema definitions match actual Zod validators in code
- ✓ All endpoints have auth documentation
- ✓ Response codes documented match implementation
- ✓ No duplicate operation IDs

## Examples

### Basic Route (Auto-Documented)
```typescript
// src/app/api/v1/projects/route.ts
export async function GET(request: NextRequest) {
  // If no @openapi comment, agent infers:
  // - Endpoint: GET /api/v1/projects
  // - Auth: required (checks for auth() call)
  // - Params: extracted from searchParams
  // - Response: inferred from NextResponse.json() calls
}
```

### Full Documentation
```typescript
/**
 * @openapi
 * /api/v1/projects/{projectId}:
 *   get:
 *     summary: Get project details
 *     tags: [Projects]
 *     parameters:
 *       - name: projectId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Project found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Project"
 *       404:
 *         description: Project not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  // ...
}
```

## Output Structure

Generated `openapi.json`:
```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Specdrivr API",
    "version": "1.0.0",
    "description": "AI-native orchestration platform API"
  },
  "servers": [
    { "url": "https://api.specdrivr.com", "description": "Production" },
    { "url": "http://localhost:3000", "description": "Development" }
  ],
  "paths": {
    "/api/v1/projects": {
      "get": { ... },
      "post": { ... }
    },
    "/api/v1/projects/{projectId}": {
      "get": { ... },
      "put": { ... },
      "delete": { ... }
    }
  },
  "components": {
    "schemas": {
      "Project": { ... },
      "CreateProjectInput": { ... },
      "ProjectList": { ... }
    },
    "securitySchemes": {
      "bearerAuth": { "type": "http", "scheme": "bearer" }
    }
  }
}
```

## Publishing Options

### Option 1: Swagger UI
```bash
# Add to package.json
"docs": "swagger-ui-express openapi.json"
```

### Option 2: Redoc (Static)
```html
<!-- In docs/index.html -->
<redoc spec-url="./openapi.json"></redoc>
```

### Option 3: GitHub Pages
```bash
# Commit openapi.json to repo
# View on: https://editor.swagger.io/?url=https://raw.githubusercontent.com/your-org/specdrivr/main/openapi.json
```

### Option 4: API Portal (Stoplight, Postman, etc.)
1. Generate `openapi.json`
2. Upload to Stoplight / Postman
3. Share with team

## Workflow Integration

### After Creating New API Route

```bash
# 1. Create route file
touch src/app/api/v1/my-endpoint/route.ts
# ... write handler ...

# 2. Generate docs
claude agent api-documenter "Add my-endpoint to OpenAPI spec"

# 3. Verify
cat openapi.json | grep "my-endpoint" # should exist

# 4. Commit
git add src/app/api/v1/my-endpoint/route.ts openapi.json
git commit -m "api: add my-endpoint with OpenAPI docs"
```

### CI/CD Integration
```yaml
# .github/workflows/docs.yml
name: Generate API Docs

on:
  push:
    paths:
      - 'src/app/api/**'

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Generate OpenAPI
        run: |
          claude agent api-documenter "Update API spec"
      - name: Commit changes
        run: |
          git config user.email "bot@specdrivr.com"
          git config user.name "API Bot"
          git add openapi.json
          git diff --quiet && git diff --staged --quiet || git commit -m "docs: update OpenAPI spec"
          git push
```

## Schema Inference

The agent intelligently infers from code:

```typescript
// Code:
const ProjectQuerySchema = z.object({
  userId: z.string().optional(),
  limit: z.number().default(50),
});

// Inferred OpenAPI schema:
{
  "type": "object",
  "properties": {
    "userId": { "type": "string" },
    "limit": { "type": "integer", "default": 50 }
  }
}
```

## API Endpoint Checklist

Before committing a new endpoint, ensure:
- [ ] Handler exports `GET`, `POST`, `PUT`, `DELETE`, etc.
- [ ] Calls `await auth()` (documented automatically)
- [ ] Has JSDoc or `@openapi` comment with description
- [ ] Returns consistent error format
- [ ] Uses Zod schema for validation (inferred)
- [ ] Run agent to generate OpenAPI

## Related Commands

- `pnpm lint` — Check for ESLint API violations
- `/code-reviewer` — Validate route handler pattern
- `openapi.json` — Generated specification
- GitHub Pages / Swagger UI — View documentation

## Troubleshooting

### Schema Not Inferred
Add explicit `@openapi` comment with schema reference

### Missing Endpoint
Verify file matches pattern: `src/app/api/**/route.ts`

### Auth Not Detected
Ensure route calls `await auth()` as first line

---

**Your API documentation stays in sync with code automatically.**
