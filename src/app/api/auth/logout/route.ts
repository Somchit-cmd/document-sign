import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, createAuditLog } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the token from header
    const token = request.headers.get('Authorization')?.substring(7) || '';

    // Delete the session
    await db.session.deleteMany({
      where: { token },
    });

    // Create audit log
    await createAuditLog(
      user.id,
      'user.logout',
      'session',
      user.id,
      request,
      `User ${user.name} logged out`
    );

    return NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
