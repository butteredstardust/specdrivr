import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 422 });
    }

    const { email, password } = parsed.data;

    const existingUser = await db.select().from(users).where(eq(users.username, email));
    if (existingUser.length > 0) {
      return NextResponse.json({ error: { code: 'CONFLICT', message: 'Email already exists' } }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db.insert(users).values({
      username: email,
      passwordHash: passwordHash,
      role: 'viewer'
    }).returning({
      id: users.id,
      username: users.username,
      role: users.role
    });

    return NextResponse.json({ data: { user: { id: newUser.id.toString(), email: newUser.username, role: newUser.role } } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' } }, { status: 500 });
  }
}
