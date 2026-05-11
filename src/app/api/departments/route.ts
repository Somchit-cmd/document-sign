import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, isAdmin, createAuditLog } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const departments = await db.department.findMany({
      include: {
        _count: { select: { members: true } },
        manager: { select: { id: true, name: true, email: true, avatarUrl: true } },
        parent: { select: { id: true, name: true, code: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error('List departments error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, code, description, parentId, managerId } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await db.department.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Department code already exists' },
        { status: 409 }
      );
    }

    const department = await db.department.create({
      data: { name, code, description, parentId, managerId },
      include: {
        _count: { select: { members: true } },
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    await createAuditLog(user.id, 'department.create', 'department', department.id, request, `Created department: ${name}`);

    return NextResponse.json(
      { success: true, data: department },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create department error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
