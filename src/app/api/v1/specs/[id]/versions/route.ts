import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { specifications, plans, specVersions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

const CreateSpecVersionSchema = z.object({
  markdownContent: z.string().min(1)
});

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const { id } = await context.params;

    const existing = await db.select().from(specifications).where(eq(specifications.id, Number(id)));
    if (existing.length === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Specification not found' } }, { status: 404 });
    }

    const versions = await db.select().from(specVersions).where(eq(specVersions.specId, Number(id))).orderBy(desc(specVersions.versionNumber));

    const mapped = versions.map(v => ({
      id: v.id.toString(),
      versionNumber: v.versionNumber,
      createdAt: v.createdAt.toISOString()
    }));

    return NextResponse.json({ data: mapped });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const parsed = CreateSpecVersionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });
    }

    const existing = await db.select().from(specifications).where(eq(specifications.id, Number(id)));
    if (existing.length === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Specification not found' } }, { status: 404 });
    }

    const spec = existing[0];
    const newVersionNumber = parseFloat(spec.version) + 0.1 || 1.1; // Simple increment for string version field

    // Get current max version number for spec_versions table
    const currentVersions = await db.select().from(specVersions).where(eq(specVersions.specId, Number(id))).orderBy(desc(specVersions.versionNumber)).limit(1);
    const newSpecVersionNum = currentVersions.length > 0 ? currentVersions[0].versionNumber + 1 : 1;

    const result = await db.transaction(async (tx) => {
      // "abandon any current non-complete plan" logic
      const activePlans = await tx.select().from(plans).where(eq(plans.specId, Number(id)));
      for (const p of activePlans) {
        if (p.status !== 'completed' && p.status !== 'archived') {
            await tx.update(plans).set({ status: 'archived' }).where(eq(plans.id, p.id));
        }
      }

      const [newVersion] = await tx.insert(specVersions).values({
        specId: Number(id),
        versionNumber: newSpecVersionNum,
        content: parsed.data.markdownContent,
        createdByUserId: Number(session.user.id)
      }).returning();

      const [updatedSpec] = await tx.update(specifications).set({
        content: parsed.data.markdownContent,
        version: newVersionNumber.toFixed(1)
      }).where(eq(specifications.id, Number(id))).returning();

      return { spec: updatedSpec, version: newVersion };
    });

    return NextResponse.json({ data: { id: result.version.id.toString(), versionNumber: result.version.versionNumber } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}
