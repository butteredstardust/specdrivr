import { NextResponse } from 'next/server';
import { autoLogin } from '@/lib/auth-utils';

export async function POST() {
  try {
    const user = await autoLogin();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Auto-login not available' },
        { status: 401 }
      );
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Auto-login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
