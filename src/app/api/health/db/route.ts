import { NextResponse } from 'next/server';
import { db } from '@/db';

export async function GET() {
  try {
    // Simple query to check database connection
    await db.execute(`
      SELECT 1 as ping
    `);

    return NextResponse.json({
      success: true,
      status: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        error: 'Database connection failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
