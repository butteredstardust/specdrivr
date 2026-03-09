import { NextResponse } from 'next/server';

// Deprecated path — full implementation is at /api/v1/tasks
export async function GET() {
  return NextResponse.json({ error: { code: 'MOVED', message: 'Use /api/v1/tasks/:id' } }, { status: 301 });
}
