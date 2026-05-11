import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession, createAuditLog } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      include: { department: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials or account deactivated' },
        { status: 401 }
      );
    }

    // Create session
    const session = await createSession(user.id, request);

    // Create audit log
    await createAuditLog(
      user.id,
      'user.login',
      'session',
      session.token,
      request,
      `User ${user.name} logged in via SSO`
    );

    // Return user info and token
    return NextResponse.json({
      success: true,
      data: {
        token: session.token,
        expiresAt: session.expiresAt,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          departmentId: user.departmentId,
          jobTitle: user.jobTitle,
          avatarUrl: user.avatarUrl,
          department: user.department ? { id: user.department.id, name: user.department.name, code: user.department.code } : null,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
