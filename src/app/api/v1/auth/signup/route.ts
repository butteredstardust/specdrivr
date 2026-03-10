import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { handleApiError } from '@/lib/error-handler';

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message, details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Email already exists' } },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [newUser] = await db.insert(users).values({
      name: email.split("@")[0],
          email: email,
      passwordHash: passwordHash,
      role: 'viewer'
    }).returning({
      id: users.id,
      email: users.email,
      role: users.role
    });

    return NextResponse.json(
      { success: true, data: { user: { id: newUser.id.toString(), email: newUser.email, role: newUser.role } } },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
