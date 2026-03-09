#!/bin/bash
sed -i 's/const { token, password, name } = parsed.data;/const { token, password } = parsed.data;/g' src/app/api/auth/accept-invite/route.ts
sed -i 's/let email = invite.email;//g' src/app/api/auth/accept-invite/route.ts
sed -i 's/export async function POST(req: Request) {/export async function POST() {/g' src/app/api/v1/notifications/read-all/route.ts
sed -i 's/export async function GET(req: Request) {/export async function GET() {/g' src/app/api/v1/notifications/route.ts
sed -i 's/import { webhooks, projects, projectMembers }/import { webhooks, projectMembers }/g' src/app/api/v1/projects/\[id\]/webhooks/\[webhookId\]/route.ts
sed -i 's/export async function GET(req: Request) {/export async function GET() {/g' src/app/api/v1/projects/route.ts
sed -i 's/import { agentLogs, projects, webhookDeliveries }/import { projects, webhookDeliveries }/g' src/app/api/webhooks/github/\[projectId\]/route.ts
sed -i 's/(project.gitConfig as any)?.webhook_secret/((project.gitConfig as Record<string, unknown>)?.webhook_secret as string)/g' src/app/api/webhooks/github/\[projectId\]/route.ts
sed -i 's/const result = await db.transaction(async (tx) => {/await db.transaction(async (tx) => {/g' src/app/api/webhooks/github/\[projectId\]/route.ts
